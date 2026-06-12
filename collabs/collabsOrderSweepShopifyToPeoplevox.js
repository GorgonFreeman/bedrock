const { funcApi } = require('../utils');

const collabsOrderSweepShopifyToPeoplevox = async (
  shopifyStore,
  {
    peoplevoxCredsPath,
  } = {},
) => {

  // Check if cursor metafield is available
  // If yes, retrieve cursor
  // If no, run without a cursor

  // Get all orders that are not sync_confirmed.
  // For each order, check if risk.custom_assessed + risk.actioned metafields are true, and any risk level is available.
  // Or, order is over 5 minutes old.

  // ...actually the cursor thing doesn't help if we're looking at older orders too. Not sure if it helps full stop, because it's mainly good for aggressively getting most recent orders, but we may not be able to do that. Orders could receive risk assessments in varying orders.

  return { 
    success: true,
    shopifyStore, 
  };
  
};

const collabsOrderSweepShopifyToPeoplevoxApi = funcApi(collabsOrderSweepShopifyToPeoplevox, {
  argNames: ['shopifyStore', 'options'],
});

module.exports = {
  collabsOrderSweepShopifyToPeoplevox,
  collabsOrderSweepShopifyToPeoplevoxApi,
};

// curl localhost:8000/collabsOrderSweepShopifyToPeoplevox -H "Content-Type: application/json" -d '{ "shopifyStore": "au" }'