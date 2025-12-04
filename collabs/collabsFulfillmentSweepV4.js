const { funcApi, logDeep, surveyNestedArrays, Processor, dateTimeFromNow, days, askQuestion } = require('../utils');

const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');
const { shopifyOrderFulfill } = require('../shopify/shopifyOrderFulfill');
const { shopifyFulfillmentOrderFulfill } = require('../shopify/shopifyFulfillmentOrderFulfill');

const { logiwaStatusToStatusId } = require('../logiwa/logiwa.utils');
const { logiwaOrdersGetter } = require('../logiwa/logiwaOrdersGet');

const collabsFulfillmentSweepV4 = async (
  store,
  {
    option,
  } = {},
) => {

  const peoplevoxRelevant = REGIONS_PVX.includes(store);
  const logiwaRelevant = REGIONS_LOGIWA.includes(store);
  const bleckmannRelevant = REGIONS_BLECKMANN.includes(store);

  const anyRelevant = [
    // peoplevoxRelevant, 
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
  const bulkStartDate = dateTimeFromNow({ minus: days(5), dateOnly: true });

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

      logFlavourText: `${ store }:shopify:getter:`,
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
      logFlavourText: `${ store }:logiwaBulk:getter:`,
    });

    wmsGetters.push(logiwaBulkGetter);

    const logiwaBulkAssessor = new Processor(
      piles.logiwaBulk,
      async (pile) => {
        const shippedLogiwaOrder = pile.shift();
        logDeep(shippedLogiwaOrder);
        await askQuestion('?');

        const {
          trackingNumbers,
          products,
        } = shippedLogiwaOrder;

        if (trackingNumbers?.length !== 1) {
          console.error(shippedLogiwaOrder);
          throw new Error(`Oh no, ${ trackingNumbers?.length } tracking numbers found for ${ shippedLogiwaOrder.code }`);
        }

        const trackingNumber = trackingNumbers[0];
    
        const allShipped = products.every(product => product.shippedUOMQuantity === product.quantity);
    
      },
      pile => pile.length === 0,
      {
        canFinish: false,
        logFlavourText: `${ store }:logiwaBulk:assessor:`,
      },
    );

    assessors.push(logiwaBulkAssessor);
  }

  const shopifyOrderFulfiller = new Processor(
    piles.shopifyOrderFulfill,
    async (pile) => {
      const order = pile.shift();
      const result = await shopifyOrderFulfill(order);
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
      const order = pile.shift();
      const result = await shopifyFulfillmentOrderFulfill(order);
      piles.results.push(result);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: `${ store }:shopifyFulfillmentOrderFulfiller:`,
    },
  );

  await Promise.all([
    shopifyGetter.run(),
    ...wmsGetters.map(getter => getter.run()),
    ...assessors.map(assessor => assessor.run()),
    shopifyOrderFulfiller.run(),
    shopifyFulfillmentOrderFulfiller.run(),
  ]);

  logDeep(surveyNestedArrays(piles));

  return { 
    store, 
    option,
  };
  
};

const collabsFulfillmentSweepV4Api = funcApi(collabsFulfillmentSweepV4, {
  argNames: ['store', 'options'],
});

module.exports = {
  collabsFulfillmentSweepV4,
  collabsFulfillmentSweepV4Api,
};

// curl localhost:8000/collabsFulfillmentSweepV4 -H "Content-Type: application/json" -d '{ "store": "us" }'