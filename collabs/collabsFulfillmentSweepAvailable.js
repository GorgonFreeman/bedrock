// Actions the fulfillments that are easiest to get from the WMS

const { funcApi, logDeep, surveyNestedArrays } = require('../utils');

const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');
const { bleckmannPickticketsGetter } = require('../bleckmann/bleckmannPickticketsGet');

const collabsFulfillmentSweepAvailable = async (
  region,
  {
    option,
  } = {},
) => {

  const pvxRelevant = REGIONS_PVX.includes(region);
  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  const bleckmannRelevant = REGIONS_BLECKMANN.includes(region);
  const anyRelevant = [
    // pvxRelevant, 
    // logiwaRelevant, 
    bleckmannRelevant,
  ].some(Boolean);

  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }

  const piles = {
    shopify: [],
    wms: [],
  };

  const getters = [];

  const getterShopify = await shopifyOrdersGetter(
    region, 
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
        // 'created_at:<2025-10-01',
        'fulfillment_status:unshipped',
        'status:open',
        'delivery_method:shipping',
      ],
      sortKey: 'CREATED_AT',
      reverse: true,

      onItems: (items) => {
        piles.shopify.push(...items);
      },

      // onDone: getterFinish,

      logFlavourText: `shopify:getter:`,
    },
  );

  getters.push(getterShopify);

  if (bleckmannRelevant) {

  }

  await Promise.all([
    ...getters.map(getter => getter.run()),
  ]);

  logDeep(surveyNestedArrays(piles));

  return { 
    region, 
    option,
  };
  
};

const collabsFulfillmentSweepAvailableApi = funcApi(collabsFulfillmentSweepAvailable, {
  argNames: ['region', 'options'],
});

module.exports = {
  collabsFulfillmentSweepAvailable,
  collabsFulfillmentSweepAvailableApi,
};

// curl localhost:8000/collabsFulfillmentSweepAvailable -H "Content-Type: application/json" -d '{ "region": "uk" }'