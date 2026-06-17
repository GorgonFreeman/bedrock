const { funcApi, credsByPath, logDeep, askQuestion } = require('../utils');

const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');

const collabsOrdersFulfillmentsFindAndAction = async (
  store,
  {
    orderQueries,
    savedSearchId,
  } = {},
) => {

  if (!orderQueries && !savedSearchId) {
    const creds = credsByPath(['shopify', store]);
    const { TRACKING_CHECK_VIEW_ID: trackingCheckViewId } = creds;
    if (!trackingCheckViewId) {
      return {
        success: false,
        error: [`Tracking check view ID not found for store ${ store } - please set in .creds.yml`],
      };
    }

    savedSearchId = trackingCheckViewId;
  }

  const orderGetOptions = {
    ...savedSearchId ? { savedSearchId } : {},
    ...!savedSearchId && orderQueries ? { queries: orderQueries } : {},
  };

  // Get all orders in Shopify that are not completely fulfilled, or, without tracking
  const ordersResponse = await shopifyOrdersGet(store, {
    ...orderGetOptions,
  });

  const { success: ordersSuccess, result: orders } = ordersResponse;

  if (!ordersSuccess) {
    return ordersResponse;
  }

  logDeep(orders);
  await askQuestion('?');

  // For each order, run collabsOrderFulfillmentFindV2 with autofulfill true

  return { 
    success: true,
  };
  
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

// curl localhost:8000/collabsOrdersFulfillmentsFindAndAction -H "Content-Type: application/json" -d '{ "store": "au" }'