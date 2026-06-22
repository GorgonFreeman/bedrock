const { funcApi, credsByPath, logDeep, askQuestion, dateTimeFromNow, days } = require('../utils');

const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');

const { 
  requiredAttrs,
  collabsOrderFulfillmentFindV2,
} = require('../collabs/collabsOrderFulfillmentFindV2');

const collabsOrdersFulfillmentsFindAndAction = async (
  store,
  {
    orderQueries,
    sinceDays,
    untilDays,
    savedSearchId,
    notifyCustomer,
  } = {},
) => {

  if (orderQueries || sinceDays || untilDays) {
    orderQueries = [
      ...orderQueries || [],
      ...sinceDays ? [`processed_at:>${ dateTimeFromNow({ minus: days(sinceDays), dateOnly: true })}`] : [],
      ...untilDays ? [`processed_at:<${ dateTimeFromNow({ minus: days(untilDays), dateOnly: true })}`] : [],
    ];
  }

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

// curl localhost:8000/collabsOrdersFulfillmentsFindAndAction -H "Content-Type: application/json" -d '{ "store": "au", "options": { "sinceDays": 7, "untilDays": 1, "notifyCustomer": false, "orderQueries": ["delivery_status:no_status", "delivery_method:shipping", "status:open", "fulfillment_status:unshipped"] } }'
// curl localhost:8100/collabsOrdersFulfillmentsFindAndAction -H "Content-Type: application/json" -d '{ "store": "au", "options": { "sinceDays": 7, "untilDays": 1, "notifyCustomer": false, "orderQueries": ["delivery_status:no_status", "delivery_method:shipping", "status:open", "fulfillment_status:shipped", "tag_not:'\''sales-order:staff'\''"] } }'
