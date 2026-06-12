const { funcApi } = require('../utils');

const collabsOrderSweepShopifyToPeoplevox = async (
  shopifyStore,
  {
    peoplevoxCredsPath,
  } = {},
) => {

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