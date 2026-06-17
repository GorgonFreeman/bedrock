const { funcApi } = require('../utils');

const collabsOrdersFulfillmentsFindAndAction = async (
  store,
  {
    orderQueries,
  } = {},
) => {

  // Get all orders in Shopify that are not completely fulfilled, or, without tracking
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

// curl localhost:8000/collabsOrdersFulfillmentsFindAndAction -H "Content-Type: application/json" -d '{ "arg": "1234" }'