const { HOSTED } = require('../constants');
const { funcApi, logDeep, gidToId, askQuestion, arrayToObj } = require('../utils');

const { collabsInventoryReview } = require('../collabs/collabsInventoryReview');

const { shopifyInventoryQuantitiesSet } = require('../shopify/shopifyInventoryQuantitiesSet');

const collabsInventorySync = async (
  region,
  {
    skus, // if provided, only sync these SKUs, and ignore other options.

    mode = 'full', 
    /* Valid values:
      full: Sync all inventory.
      safe: Only sync if Shopify has more than the WMS, or, there is no stock in Shopify. These syncs are unlikely to cause oversells.
      overs: Only sync if Shopify has more than the WMS. Almost always safe, the only risk is that inventory being moved is taken offline before it's available again in the WMS.
    */
    
    minDiff,
    ...inventoryReviewOptions
  } = {},
) => {

  inventoryReviewOptions = {
    ...inventoryReviewOptions,
    minReportableDiff: minDiff,
  };

  const inventoryReviewResponse = await collabsInventoryReview(
    region, 
    skus ? { skus } : inventoryReviewOptions,
  );

  const { 
    success: reviewSuccess,
    result: inventoryReview,
  } = inventoryReviewResponse;
  if (!reviewSuccess) {
    return inventoryReviewResponse;
  }

  const { array: inventoryReviewArray } = inventoryReview;

  const shopifyInventoryQuantitiesSetPayloads = [];

  for (const item of inventoryReviewArray) {
    const { 
      sku,
      shopifyQty,
      wmsQty, 
      oversellRisk,
      safeToImport,
      inventoryItemId,
      locationId,
    } = item;

    switch (mode) {
      case 'safe':
        if (!safeToImport) {
          continue;
        }
        break;
      case 'overs':
        if (!oversellRisk) {
          continue;
        }
        break;
      default:
        // Do nothing
    }

    // Sync inventory
    !HOSTED && console.log(`Syncing ${ wmsQty } of ${ sku }, currently ${ shopifyQty }`);
    shopifyInventoryQuantitiesSetPayloads.push({
      inventoryItemId: `gid://shopify/InventoryItem/${ inventoryItemId }`,
      locationId: `gid://shopify/Location/${ locationId }`,
      quantity: Number(wmsQty),
    });
  }
  
  !HOSTED && logDeep('shopifyInventoryQuantitiesSetPayloads', shopifyInventoryQuantitiesSetPayloads);
  !HOSTED && await askQuestion('?');

  const shopifyInventoryQuantitiesSetResponse = await shopifyInventoryQuantitiesSet(
    region,
    'available',
    shopifyInventoryQuantitiesSetPayloads,
    'correction',
  );
  return shopifyInventoryQuantitiesSetResponse;
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
// curl localhost:8000/collabsInventorySync -H "Content-Type: application/json" -d '{ "region": "au", "options": { "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved"] } }'

// Min diff 10 + published
// curl localhost:8000/collabsInventorySync -H "Content-Type: application/json" -d '{ "region": "au", "options": { "minDiff": 10, "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved"] } }'

// US published
// curl localhost:8000/collabsInventorySync -H "Content-Type: application/json" -d '{ "region": "us", "options": { "minDiff": 3, "shopifyVariantsFetchQueries": ["tag_not:not_for_radial", "published_status:published", "product_publication_status:approved"] } }'

// US using export
// curl localhost:8000/collabsInventorySync -H "Content-Type: application/json" -d '{ "region": "us", "options": { "shopifyVariantsFetchQueries": ["tag_not:not_for_radial", "published_status:published", "product_publication_status:approved"], "wmsExportSpreadsheetIdentifier": { "spreadsheetHandle": "foxtron_stock_check" }, "wmsExportSheetIdentifier": { "sheetName": "Sheet 1" } } }'