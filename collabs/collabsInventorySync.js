const { funcApi, logDeep } = require('../utils');

const { shopifyVariantsGet } = require('../shopify/shopifyVariantsGet');

const collabsInventorySync = async (
  region,
  {
    skus, // if provided, only sync these SKUs, and ignore other options.
    shopifyVariantsFetchQueries,
    minDiff = 0, // Only sync if the diff is greater than or equal to this value.
    safeMode, // Only sync if Shopify has more than the WMS, or, there is no stock in Shopify. These syncs are unlikely to cause oversells.
  } = {},
) => {

  // Get the location ID
  // Get the Shopify inventory item IDs and stock
  // Get the WMS inventory

  if (skus) {
    return {
      success: false,
      errors: ['Inventory sync for a list of skus is not supported yet.'],
    };
  }

  const shopifyVariantsResponse = await shopifyVariantsGet(
    region,
    {
      attrs: 'sku inventoryQuantity inventoryItem { id }',
      ...(shopifyVariantsFetchQueries ? { queries: shopifyVariantsFetchQueries } : {}),
    },
  );

  const { success: shopifyVariantsSuccess, result: shopifyVariants } = shopifyVariantsResponse;
  if (!shopifyVariantsSuccess) {
    return shopifyVariantsResponse;
  }
  
  logDeep(shopifyVariants);
  return {
    success: true,
    result: shopifyVariants,
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

// Only published variants
// curl localhost:8000/collabsInventorySync -H "Content-Type: application/json" -d '{ "region": "au", "options": { "shopifyVariantsFetchQueries": [ "published_status:published", "product_publication_status:approved" ] } }'