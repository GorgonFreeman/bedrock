const { funcApi } = require('../utils');

const collabsInventorySync = async (
  region,
  {
    skus, // if provided, only sync these SKUs, and ignore other options.
    shopifyVariantsFetchQueries,
    minDiff = 0, // Only sync if the diff is greater than or equal to this value.
    safeMode, // Only sync if Shopify has more than the WMS, or, there is no stock in Shopify. These syncs are unlikely to cause oversells.
  } = {},
) => {

  if (skus) {
    return {
      success: false,
      errors: ['Inventory sync for a list of skus is not supported yet.'],
    };
  }

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