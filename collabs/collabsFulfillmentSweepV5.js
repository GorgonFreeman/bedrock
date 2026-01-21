// A fulfillment sweep based on fulfillment orders, explicitly fulfilling payloads of line items wherever possible.

const { 
  HOSTED,
  REGIONS_LOGIWA,
} = require('../constants');
const { funcApi, logDeep, surveyNestedArrays, Processor, ThresholdActioner, askQuestion, minutes, standardErrorIs } = require('../utils');

const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');

const { collabsOrderFulfillmentFind, collabsOrderFulfillmentFindSchema } = require('../collabs/collabsOrderFulfillmentFind');

const { logiwaOrdersGetter } = require('../logiwa/logiwaOrdersGet');

const collabsFulfillmentSweepV5 = async (
  store,
) => {

  piles = {
    shopify: [],
    missing: [],
    unshipped: [],
    fulfilled: [],
  };

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
  
      logFlavourText: `${ store }:shopifyGetter:`,
    },
  );

  const wmsGetters = [];
  const assessors = [];

  if (REGIONS_LOGIWA.includes(store)) {

    piles.logiwaBulk = piles.logiwaBulk || [];

    const logiwaBulkGetter = await logiwaOrdersGetter(
      {
        onItems: (items) => {
          piles.logiwaBulk.push(...items);
        },
        logFlavourText: `${ store }:logiwaBulkGetter:`,
      },
    );

    const logiwaBulkAssessor = new Processor(
      piles.logiwaBulk,
      async (pile) => {
        const logiwaOrder = pile.shift();
        logDeep(logiwaOrder);
        await askQuestion('?');
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

      const shopifyOrder = pile.pop();

      const fulfillmentFindResponse = await collabsOrderFulfillmentFind(store, { orderName: shopifyOrder.name }, { suppliedData: { shopifyOrder } });

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

      logDeep({ fulfillmentFindResponse });
      await askQuestion('?');

      // piles.fulfilled.push(fulfillmentFindResponse);
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