// A fulfillment sweep based on fulfillment orders, explicitly fulfilling payloads of line items wherever possible.

const { 
  HOSTED,
  REGIONS_LOGIWA,
} = require('../constants');
const { funcApi, logDeep, surveyNestedArrays, Processor, ThresholdActioner, askQuestion, minutes, standardErrorIs, wait, dateTimeFromNow, days } = require('../utils');

const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');

const { collabsOrderFulfillmentFind, collabsOrderFulfillmentFindSchema } = require('../collabs/collabsOrderFulfillmentFind');

const { logiwaOrdersGetter } = require('../logiwa/logiwaOrdersGet');

const collabsFulfillmentSweepV5 = async (
  store,
) => {

  const piles = {
    shopify: [],
    missing: [],
    unshipped: [],
    fulfilled: [],
  };

  // Arbitrary date for bulk fetching to start from to get probably-relevant results
  const bulkStartDate = dateTimeFromNow({ minus: days(20), dateOnly: true });

  const handleFulfillmentFindResponse = async (fulfillmentFindResponse, shopifyOrder) => {
    const { success: fulfillmentFindSuccess, result: fulfillmentFindResult, error: fulfillmentFindError } = fulfillmentFindResponse;

    if (!fulfillmentFindSuccess) {

      if (standardErrorIs(fulfillmentFindError, e => e === 'Order not found')) {
        piles.missing.push(shopifyOrder);
        return;
      }

      // piles.fulfilled.push(fulfillmentFindResponse);
      // return;
    }

    const { message, fulfillResults } = fulfillmentFindResult;

    if (message === 'Order not shipped') {
      piles.unshipped.push(shopifyOrder);
      return;
    }

    if (fulfillResults?.length) {
      piles.fulfilled.push(shopifyOrder);
      return;
    }
    
    console.log('Unhandled fulfillmentFindResponse');
    logDeep({ fulfillmentFindResponse });
    await askQuestion('?');
  };

  let shopifyGetterFinished = false;

  const shopifyGetter = await shopifyOrdersGetter(
    store,
    {
      attrs: collabsOrderFulfillmentFindSchema.SHOPIFY_ORDER_ATTRS,
      queries: [
        'created_at:>2025-06-01',
        'fulfillment_status:unshipped',
        'status:open',
        'delivery_method:shipping',
      ],
      sortKey: 'CREATED_AT',
      reverse: true,

      onItems: (items) => {
        // logDeep(items);
        piles.shopify.push(...items);
      },

      onDone: () => {
        shopifyGetterFinished = true;
      },
  
      logFlavourText: `${ store }:shopifyGetter:`,
    },
  );

  const wmsGetters = [];
  const assessors = [];

  if (REGIONS_LOGIWA.includes(store)) {

    piles.logiwaBulk = piles.logiwaBulk || [];

    const logiwaBulkGetter = await logiwaOrdersGetter(
      {
        createdDateTime_bt: `${ new Date(bulkStartDate).toISOString() },${ new Date().toISOString() }`,
        onItems: (items) => {

          if (shopifyGetterFinished && piles.shopify.length === 0) {
            logiwaBulkGetter.end();
          }

          piles.logiwaBulk.push(...items);
        },
        logFlavourText: `${ store }:logiwaBulkGetter:`,
      },
    );

    const logiwaBulkAssessor = new Processor(
      piles.logiwaBulk,
      async (pile) => {
        
        // Prevent this from clogging up the pipeline with synchronous early returns
        await wait(1);

        logDeep(surveyNestedArrays(piles));

        const logiwaOrder = pile.shift();

        const shopifyOrder = piles.shopify.find(o => o.name === logiwaOrder.code);

        if (!shopifyOrder) {

          // put it back, unless all shopify orders are in
          if (!shopifyGetterFinished) {
            piles.logiwaBulk.push(logiwaOrder);
          }
          
          // otherwise discard the logiwa order (leave it shifted)
          return;
        }

        // Remove shopify order from piles
        const shopifyOrderIndex = piles.shopify.indexOf(shopifyOrder);
        if (shopifyOrderIndex === -1) {
          return;
        }
        piles.shopify.splice(shopifyOrderIndex, 1);
        
        const { shipmentOrderStatusName } = logiwaOrder;
        if (shipmentOrderStatusName !== 'Shipped') {
          piles.unshipped.push(shopifyOrder);
          return;
        }

        logDeep(logiwaOrder);
        await askQuestion('Proceed to find fulfillment?');

        const fulfillmentFindResponse = await collabsOrderFulfillmentFind(
          store, 
          { 
            orderName: shopifyOrder.name,
          }, 
          { 
            suppliedData: { 
              shopifyOrder,
              logiwaOrder,
            },
          },
        );

        await handleFulfillmentFindResponse(fulfillmentFindResponse, shopifyOrder);
        
        return;
      },
      pile => pile.length === 0,
      {
        canFinish: false,
        logFlavourText: `${ store }:logiwaBulkAssessor:`,
      },
    );

    logiwaBulkGetter.on('done', () => {
      logiwaBulkAssessor.canFinish = true;
    });
    
    wmsGetters.push(logiwaBulkGetter);
    assessors.push(logiwaBulkAssessor);
  }
    
  const collabsThoroughAssessor = new Processor(
    piles.shopify,
    async (pile) => {

      logDeep(surveyNestedArrays(piles));

      const shopifyOrder = pile.shift();

      const fulfillmentFindResponse = await collabsOrderFulfillmentFind(store, { orderName: shopifyOrder.name }, { suppliedData: { shopifyOrder } });

      await handleFulfillmentFindResponse(fulfillmentFindResponse, shopifyOrder);

      return;
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: `${ store }:collabsThoroughAssessor:`,
      runOptions: {
        interval: 1,
      },
    },
  );

  shopifyGetter.on('done', () => {
    collabsThoroughAssessor.canFinish = true;
  });

  assessors.push(collabsThoroughAssessor);

  await Promise.all([
    shopifyGetter.run({ verbose: !HOSTED }),
    ...wmsGetters.map(getter => getter.run({ verbose: !HOSTED })),
    ...assessors.map(assessor => assessor.run({ verbose: !HOSTED })),
  ]);

  logDeep(surveyNestedArrays(piles));

  return { 
    success: true,
    result: surveyNestedArrays(piles),
  };
  
};

const collabsFulfillmentSweepV5Api = funcApi(collabsFulfillmentSweepV5, {
  argNames: ['store'],
});

module.exports = {
  collabsFulfillmentSweepV5,
  collabsFulfillmentSweepV5Api,
};

// curl localhost:8000/collabsFulfillmentSweepV5 -H "Content-Type: application/json" -d '{ "store": "us" }'