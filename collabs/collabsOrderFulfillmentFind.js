const {
  REGIONS_LOGIWA,
} = require('../constants');

const { funcApi, logDeep } = require('../utils');

const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { logiwaOrderGet } = require('../logiwa/logiwaOrderGet');

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

  const shopifyOrderResponse = await shopifyOrderGet(region, { orderId }, {
    attrs: 'id name fulfillable',
  });

  if (!shopifyOrderResponse.success) {
    return shopifyOrderResponse;
  }

  const { 
    name: orderName,
    fulfillable,
  } = shopifyOrderResponse.result;

  if (!fulfillable) {
    return {
      success: false,
      message: 'Order is not fulfillable',
    };
  }

  if (logiwaRelevant) {
    const logiwaOrderResponse = await logiwaOrderGet({ orderCode: orderName });
    if (!logiwaOrderResponse.success) {
      return logiwaOrderResponse;
    }

    logDeep(logiwaOrderResponse.result);
  }
  
  const response = {
    success: true,
    result: {
      orderName,
    },
  };
  logDeep(response);
  return response;
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