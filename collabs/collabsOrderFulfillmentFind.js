const {
  REGIONS_LOGIWA,
} = require('../constants');

const { funcApi, logDeep } = require('../utils');

const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');

const collabsOrderFulfillmentFind = async (
  region,
  orderId,
  {
    option,
  } = {},
) => {

  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  const anyRelevant = [logiwaRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }

  const shopifyOrderResponse = await shopifyOrderGet(region, { orderId });
  logDeep(shopifyOrderResponse);
  return shopifyOrderResponse;
  
};

const collabsOrderFulfillmentFindApi = funcApi(collabsOrderFulfillmentFind, {
  argNames: ['region', 'orderId', 'options'],
  validatorsByArg: {
    region: Boolean,
    orderId: Boolean,
  },
});

module.exports = {
  collabsOrderFulfillmentFind,
  collabsOrderFulfillmentFindApi,
};

// curl localhost:8000/collabsOrderFulfillmentFind -H "Content-Type: application/json" -d '{ "region": "us", "orderId": "5979642789948" }'