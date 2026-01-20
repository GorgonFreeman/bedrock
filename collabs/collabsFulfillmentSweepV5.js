// A fulfillment sweep based on fulfillment orders, explicitly fulfilling payloads of line items wherever possible.

const { 
  HOSTED,
  REGIONS_LOGIWA,
} = require('../constants');
const { funcApi, logDeep, surveyNestedArrays, Processor, ThresholdActioner, askQuestion, minutes, standardErrorIs } = require('../utils');

const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');

const { collabsOrderFulfillmentFind, collabsOrderFulfillmentFindSchema } = require('../collabs/collabsOrderFulfillmentFind');

const collabsFulfillmentSweepV5 = async (
  store,
) => {

  piles = {
    shopify: [],
    missing: [],
    unshipped: [],
    fulfilled: [],
  };

  // Calculate date that is 30 minutes ago (orders must be at least half an hour old)
  const thirtyMinutesAgo = new Date(Date.now() - minutes(30));
  const createdAtFilter = `created_at:<${ thirtyMinutesAgo.toISOString().split('.')[0] }`;

  const shopifyGetter = await shopifyOrdersGetter(
    store,
    {
      attrs: collabsOrderFulfillmentFindSchema.SHOPIFY_ORDER_ATTRS,
      queries: [
        'created_at:>2025-06-01',
        createdAtFilter,
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
    
    const collabsThoroughAssessor = new Processor(
      piles.shopify,
      async (pile) => {

        logDeep(surveyNestedArrays(piles));

        const shopifyOrder = pile.shift();

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

        logDeep({ fulfillmentFindResponse });
        await askQuestion('?');

        // piles.fulfilled.push(fulfillmentFindResponse);
      },
      pile => pile.length === 0,
      {
        canFinish: false,
        logFlavourText: `${ store }:collabsThoroughAssessor:`,
      },
    );

    shopifyGetter.on('done', () => {
      collabsThoroughAssessor.canFinish = true;
    });

    assessors.push(collabsThoroughAssessor);
  }

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