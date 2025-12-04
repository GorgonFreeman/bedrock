const { funcApi, logDeep, surveyNestedArrays } = require('../utils');

const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');

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

  await Promise.all([
    shopifyGetter.run(),
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