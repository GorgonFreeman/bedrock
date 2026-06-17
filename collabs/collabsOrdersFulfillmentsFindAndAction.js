const { funcApi, credsByPath, logDeep, askQuestion } = require('../utils');

const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');

const { 
  requiredAttrs,
  collabsOrderFulfillmentFindV2,
} = require('../collabs/collabsOrderFulfillmentFindV2');

const collabsOrdersFulfillmentsFindAndAction = async (
  store,
  {
    orderQueries,
    savedSearchId,
    notifyCustomer,
  } = {},
) => {

  const orderGetOptions = {
    ...savedSearchId ? { savedSearchId } : {},
    ...!savedSearchId && orderQueries ? { queries: orderQueries } : {},
  };

  // Get all orders in Shopify that are not completely fulfilled, or, without tracking
  const ordersResponse = await shopifyOrdersGet(store, {
    ...orderGetOptions,
    attrs: requiredAttrs,
  });

  const { success: ordersSuccess, result: orders } = ordersResponse;

  if (!ordersSuccess) {
    return ordersResponse;
  }

  logDeep(orders);
  await askQuestion('?');

  // For each order, run collabsOrderFulfillmentFindV2 with autofulfill true
  const response = await collabsOrderFulfillmentFindV2(
    store, 
    orders.map(order => ({ orderData: order })),
    {
      autofulfill: true,
      notifyCustomer,
    },
  );

  return response;
};

const collabsOrdersFulfillmentsFindAndActionApi = funcApi(collabsOrdersFulfillmentsFindAndAction, {
  argNames: [
    'store', 
    'options',
  ],
});

module.exports = {
  collabsOrdersFulfillmentsFindAndAction,
  collabsOrdersFulfillmentsFindAndActionApi,
};

// curl localhost:8000/collabsOrdersFulfillmentsFindAndAction -H "Content-Type: application/json" -d '{ "store": "au", "options": { "orderQueries": ["delivery_status:no_status", "processed_at:past_quarter", "delivery_method:shipping", "status:open"] } }'
// curl localhost:8000/collabsOrdersFulfillmentsFindAndAction -H "Content-Type: application/json" -d '{ "store": "au", "options": { "orderQueries": ["delivery_status:no_status", "fulfillment_status:shipped", "processed_at:past_week"] } }'