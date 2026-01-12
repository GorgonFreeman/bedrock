const { funcApi, logDeep, surveyNestedArrays, Processor, dateTimeFromNow, days, askQuestion, ThresholdActioner, wait, gidToId } = require('../utils');

const {
  HOSTED,
  REGIONS_STARSHIPIT,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');
const { shopifyOrderFulfill } = require('../shopify/shopifyOrderFulfill');
const { shopifyFulfillmentOrderFulfill } = require('../shopify/shopifyFulfillmentOrderFulfill');

const { logiwaStatusToStatusId } = require('../logiwa/logiwa.utils');
const { logiwaOrdersGetter } = require('../logiwa/logiwaOrdersGet');
const { logiwaOrderGet } = require('../logiwa/logiwaOrderGet');

const { shopifyRegionToStarshipitAccount } = require('../mappings');
const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');

const { bedrock_unlisted_slackErrorPost } = require('../bedrock_unlisted/bedrock_unlisted_slackErrorPost');

const collabsFulfillmentSweepV4 = async (
  store,
  {
    option,
  } = {},
) => {

  const starshipitRelevant = REGIONS_STARSHIPIT.includes(store);
  const logiwaRelevant = REGIONS_LOGIWA.includes(store);
  const bleckmannRelevant = REGIONS_BLECKMANN.includes(store);

  const anyRelevant = [
    starshipitRelevant, 
    logiwaRelevant, 
    // bleckmannRelevant,
  ].some(Boolean);

  if (!anyRelevant) {
    return {
      success: false,
      message: 'Store not supported',
    };
  }
  
  // Arbitrary date for bulk fetching to start from to get probably-relevant results
  const bulkStartDate = dateTimeFromNow({ minus: days(20), dateOnly: true });

  const piles = {
    shopify: [],
    shopifyOrderFulfill: [],
    shopifyFulfillmentOrderFulfill: [],
    results: [],
    errors: [],
  };

  const shopifyGetter = await shopifyOrdersGetter(
    store, 
    {
      attrs: `
        id
        name
        shippingLine {
          title
        }
      `,
      queries: [
        'created_at:>2025-10-01',
        'fulfillment_status:unshipped',
        'status:open',
        'delivery_method:shipping',
      ],
      sortKey: 'CREATED_AT',
      reverse: true,

      onItems: (items) => {
        piles.shopify.push(...items);
      },

      logFlavourText: `${ store }:shopifyGetter:`,
    },
  );

  let wmsGetters = [];
  let assessors = [];

  if (logiwaRelevant) {

    piles.logiwaBulk = piles.logiwaBulk || [];

    const logiwaBulkGetter = await logiwaOrdersGetter({
      createdDateTime_bt: `${ new Date(bulkStartDate).toISOString() },${ new Date().toISOString() }`,
      status_eq: logiwaStatusToStatusId('Shipped'),
      onItems: (items) => {
        piles.logiwaBulk.push(...items);
      },
      logFlavourText: `${ store }:logiwaBulkGetter:`,
    });

    wmsGetters.push(logiwaBulkGetter);

    const logiwaBulkAssessor = new Processor(
      piles.logiwaBulk,
      async (pile) => {

        if (!logiwaBulkAssessor.canFinish) {
          await wait(1);
        }

        const shippedLogiwaOrder = pile.shift();

        const shopifyOrder = piles.shopify.find(o => o.name === shippedLogiwaOrder.code);
        if (!shopifyOrder) {
          if (!logiwaBulkAssessor.canFinish) {
            piles.logiwaBulk.push(shippedLogiwaOrder);
          }
          return;
        }
        
        const {
          trackingNumbers,
          products,
        } = shippedLogiwaOrder;
        
        // TODO: Revisit handling of multiple tracking numbers
        if (trackingNumbers?.length !== 1) {
          console.error(shippedLogiwaOrder);
          console.error(`Oh no, ${ trackingNumbers?.length } tracking numbers found for ${ shippedLogiwaOrder.code }`);
          return;
        }

        const trackingNumber = trackingNumbers[0];
    
        const allShipped = products.every(product => product.shippedUOMQuantity === product.quantity);
    
        if (!trackingNumber || !allShipped) {
          logDeep(`Logiwa something wrong`, { trackingNumber, allShipped }, shippedLogiwaOrder);
          return;
        }
    
        const fulfillPayload = {
          originAddress: {
            // Logiwa, therefore US
            countryCode: 'US',
          },
          trackingInfo: {
            number: trackingNumber,
          },
        };
    
        piles.shopifyOrderFulfill.push([
          store,
          { orderName: shippedLogiwaOrder.code },
          {
            notifyCustomer: true,
            ...fulfillPayload,
          },
        ]);

        // Remove shopify order
        const shopifyOrderIndex = piles.shopify.indexOf(shopifyOrder);
        if (shopifyOrderIndex === -1) {
          return;
        }
        piles.shopify.splice(shopifyOrderIndex, 1);

        console.log(`${ store }:logiwaBulkAssessor:`, piles.shopify.length);
      },
      pile => pile.length === 0,
      {
        canFinish: false,
        logFlavourText: `${ store }:logiwaBulkAssessor:`,
      },
    );

    assessors.push(logiwaBulkAssessor);
    
    const bulkAssessorBlockers = [shopifyGetter, logiwaBulkGetter];
    const bulkAssessorFinishPermitter = new ThresholdActioner(bulkAssessorBlockers.length, () => {
      logiwaBulkAssessor.canFinish = true;
    });
    bulkAssessorBlockers.forEach(blocker => blocker.on('done', bulkAssessorFinishPermitter.increment));

    const logiwaThoroughAssessor = new Processor(
      piles.shopify,
      async (pile) => {
        const shopifyOrder = pile.shift();
        console.log(`${ store }:logiwaThoroughAssessor:`, piles.shopify.length);
        const { name } = shopifyOrder;

        const logiwaOrderResponse = await logiwaOrderGet({ orderCode: name });
        const { success: logiwaOrderSuccess, result: logiwaOrder } = logiwaOrderResponse;
        if (!logiwaOrderSuccess) {
          piles.errors.push(shopifyOrder);
          return;
        }
        
        if (!logiwaOrder) {
          piles.errors.push(shopifyOrder);
          return;
        }

        const {
          shipmentOrderStatusName,
        } = logiwaOrder;

        if (shipmentOrderStatusName !== 'Shipped') {
          return;
        }
        
        // TODO: Deduplicate this logic
        const {
          trackingNumbers,
          products,
        } = logiwaOrder;
        
        // TODO: Revisit handling of multiple tracking numbers
        if (trackingNumbers?.length !== 1) {
          console.error(logiwaOrder);
          console.error(`Oh no, ${ trackingNumbers?.length } tracking numbers found for ${ logiwaOrder.code }`);
          return;
        }

        const trackingNumber = trackingNumbers[0];
    
        const allShipped = products.every(product => product.shippedUOMQuantity === product.quantity);
    
        if (!trackingNumber || !allShipped) {
          logDeep(`Logiwa something wrong`, { trackingNumber, allShipped }, logiwaOrder);
          return;
        }
    
        const fulfillPayload = {
          originAddress: {
            // Logiwa, therefore US
            countryCode: 'US',
          },
          trackingInfo: {
            number: trackingNumber,
          },
        };
    
        piles.shopifyOrderFulfill.push([
          store,
          { orderName: logiwaOrder.code },
          {
            notifyCustomer: true,
            ...fulfillPayload,
          },
        ]);        
      },
      pile => pile.length === 0,
      {
        canFinish: false,
        logFlavourText: `${ store }:logiwaThoroughAssessor:`,
        runOptions: {
          interval: 20,
        },
      },
    );

    assessors.push(logiwaThoroughAssessor);

    const thoroughAssessorBlockers = [shopifyGetter];
    const thoroughAssessorFinishPermitter = new ThresholdActioner(thoroughAssessorBlockers.length, () => {
      logiwaThoroughAssessor.canFinish = true;
    });
    thoroughAssessorBlockers.forEach(blocker => blocker.on('done', thoroughAssessorFinishPermitter.increment));
  }

  if (starshipitRelevant) {
    const starshipitThoroughAssessor = new Processor(
      piles.shopify,
      async (pile) => {

        const shopifyOrder = pile.shift();
        const { 
          id: orderGid, 
          shippingLine,
        } = shopifyOrder;
        const orderId = gidToId(orderGid);
        const shippingMethod = shippingLine?.title;

        console.log(`${ store }:starshipitThoroughAssessor:`, piles.shopify.length);

        const starshipitAccount = shopifyRegionToStarshipitAccount(store, shippingMethod);

        if (!starshipitAccount) {
          console.error(`No Starshipit account found for ${ store }:${ shippingMethod } (${ orderId })`);
          throw new Error(`No Starshipit account found for ${ store }:${ shippingMethod } (${ orderId })`);
          return;
        }

        const starshipitOrderResponse = await starshipitOrderGet(starshipitAccount, { orderNumber: orderId });
        const { success, result: starshipitOrder } = starshipitOrderResponse;
        if (!success || !starshipitOrder) {
          console.error(`Failed to retrieve order from Starshipit for ${ store }:${ shippingMethod } (${ orderId })`);
          piles.errors.push(`Failed to retrieve order from Starshipit for ${ store }:${ shippingMethod } (${ orderId })`);
          return;
        }

        const {
          packages,
          manifested,
        } = starshipitOrder;

        if (!manifested) {
          console.log(`Not manifested`);
          return;
        }

        const package = packages?.[0];

        if (!package) {
          console.log(`No package`);
          return;
        }

        const {
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
        } = package;

        if (!trackingNumber) {
          console.log(`No tracking number`);
          return;
        }

        const fulfillPayload = {
          originAddress: {
            // Starshipit, therefore AU
            countryCode: 'AU',
          },
          trackingInfo: {
            number: trackingNumber,
            url: trackingUrl,
          },
        };

        piles.shopifyOrderFulfill.push([
          store,
          { orderId },
          {
            notifyCustomer: true, // TODO: Consider setting to true if recent order
            ...fulfillPayload,
          },
        ]);
      },
      pile => pile.length === 0,
      {
        canFinish: false,
        logFlavourText: `${ store }:starshipitThoroughAssessor:`,
        runOptions: {
          interval: 20,
        },
      },
    );

    assessors.push(starshipitThoroughAssessor);

    const thoroughAssessorBlockers = [shopifyGetter];
    const thoroughAssessorFinishPermitter = new ThresholdActioner(thoroughAssessorBlockers.length, () => {
      starshipitThoroughAssessor.canFinish = true;
    });
    thoroughAssessorBlockers.forEach(blocker => blocker.on('done', thoroughAssessorFinishPermitter.increment));
  }

  const shopifyOrderFulfiller = new Processor(
    piles.shopifyOrderFulfill,
    async (pile) => {
      const args = pile.shift();
      logDeep('shopifyOrderFulfiller', args);
      const result = await shopifyOrderFulfill(...args);
      piles.results.push(result);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: `${ store }:shopifyOrderFulfiller:`,
    },
  );

  const shopifyFulfillmentOrderFulfiller = new Processor(
    piles.shopifyFulfillmentOrderFulfill,
    async (pile) => {
      const args = pile.shift();
      const result = await shopifyFulfillmentOrderFulfill(...args);
      piles.results.push(result);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: `${ store }:shopifyFulfillmentOrderFulfiller:`,
    },
  );
  
  // TODO: Helper function that does this, taking blockers and a blockee
  const fulfillerBlockers = assessors;
  const fulfillerFinishPermitter = new ThresholdActioner(fulfillerBlockers.length, () => {
    shopifyOrderFulfiller.canFinish = true;
    shopifyFulfillmentOrderFulfiller.canFinish = true;
  });
  fulfillerBlockers.forEach(blocker => blocker.on('done', fulfillerFinishPermitter.increment));

  await Promise.all([
    shopifyGetter.run({ verbose: !HOSTED }),
    ...wmsGetters.map(getter => getter.run({ verbose: !HOSTED })),
    ...assessors.map(assessor => assessor.run({ verbose: false })),
    shopifyOrderFulfiller.run({ verbose: !HOSTED }),
    shopifyFulfillmentOrderFulfiller.run({ verbose: !HOSTED }),
  ]);

  logDeep(surveyNestedArrays(piles));

  return { 
    store, 
    option,
  };
  
};

const collabsFulfillmentSweepV4Api = funcApi(collabsFulfillmentSweepV4, {
  argNames: ['store', 'options'],
  requireHostedApiKey: true,
  errorReporter: bedrock_unlisted_slackErrorPost,
  errorReporterPayload: { options: { logFlavourText: 'collabsFulfillmentSweepV4' } },
});

module.exports = {
  collabsFulfillmentSweepV4,
  collabsFulfillmentSweepV4Api,
};

// curl localhost:8000/collabsFulfillmentSweepV4 -H "Content-Type: application/json" -d '{ "store": "us" }'
// curl localhost:8000/collabsFulfillmentSweepV4 -H "Content-Type: application/json" -d '{ "store": "au" }'