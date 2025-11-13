const { funcApi } = require('../utils');

const collabsInventorySync = async (
  region,
  {
    skus,
    shopifyVariantsFetchQueries,
    minDiff = 0,
    safeMode, // Only sync if Shopify has more than the WMS, or, there is no stock in Shopify. These syncs are unlikely to cause oversells.
  } = {},
) => {

  return {
    success: true,
    result: `Didn't do anything c:`,
  };
  
};

const collabsInventorySyncApi = funcApi(collabsInventorySync, {
  argNames: ['region', 'options'],
});

module.exports = {
  collabsInventorySync,
  collabsInventorySyncApi,
};

// curl localhost:8000/collabsInventorySync -H "Content-Type: application/json" -d '{ "region": "au" }'