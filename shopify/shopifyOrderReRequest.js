// Cancels the current outstanding fulfillment with a 3rd party fulfillment provider, and recreates it.

const { funcApi, logDeep } = require('../utils');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');

const attrs = `
  id 
  fulfillmentOrders (first:50) { 
    edges { 
      node { 
        id 
        requestStatus
        status
      }
    }
  }
`;

const shopifyOrderReRequest = async (
  credsPath,
  orderIdentifier,
  {
    apiVersion,
  } = {},
) => {

  const orderResponse = await shopifyOrderGet(
    credsPath, 
    orderIdentifier, 
    { 
      apiVersion, 
      attrs,
    },
  );

  const { success: orderSuccess, result: order } = orderResponse;

  if (!orderSuccess) {
    return orderResponse;
  }

  const { 
    id: orderGid,
    fulfillmentOrders, 
  } = order;

  const response = {
    success: true,
    result: order,
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