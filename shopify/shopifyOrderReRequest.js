// Cancels the current outstanding fulfillment with a 3rd party fulfillment provider, and recreates it.

const { funcApi, logDeep } = require('../utils');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');

const attrs = `
  id 
  displayFulfillmentStatus
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
    displayFulfillmentStatus,
    fulfillmentOrders, 
  } = order;

  if (displayFulfillmentStatus === 'FULFILLED') {
    return {
      success: true,
      result: `Order is already fulfilled. No need to re-request.`,
      code: 204,
    };
  }

  if (fulfillmentOrders.length === 50) {
    return {
      success: false,
      errors: [`Order could have more than one page of fulfillment orders. Please check manually.`],
    };
  }

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