// Cancels the current outstanding fulfillment with a 3rd party fulfillment provider, and recreates it.

const { funcApi, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const shopifyOrderReRequest = async (
  credsPath,
  orderIdentifier,
  {
    apiVersion,
  } = {},
) => {

  const response = {
    success: true,
    result: {
      credsPath,
      orderIdentifier,
      apiVersion,
    },
  };
  logDeep(response);
  return response;
};

const shopifyOrderReRequestApi = funcApi(shopifyOrderReRequest, {
  argNames: ['credsPath', 'orderIdentifier', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    orderIdentifier: Boolean,
  },
});

module.exports = {
  shopifyOrderReRequest,
  shopifyOrderReRequestApi,
};

// curl localhost:8000/shopifyOrderReRequest -H "Content-Type: application/json" -d '{ "credsPath": "uk", "orderIdentifier": { "orderId": "12619061363061" } }'