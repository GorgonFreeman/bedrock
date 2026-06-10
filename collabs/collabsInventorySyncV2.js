const {
  HOSTED,
} = require('../constants');
const { funcApi, logDeep, askQuestion } = require('../utils');

const { collabsInventoryReviewOnHand } = require('../collabs/collabsInventoryReviewOnHand');
const { shopifyInventoryQuantitiesSet } = require('../shopify/shopifyInventoryQuantitiesSet');

const collabsInventorySyncV2 = async (
  store,
  {
    reviewInputs, // Supply review inputs for the function to run the review first,
    reviewOutputArray, // or supply review output from a previous run.
    spreadsheetIdentifier, // Review output from a sheet
  },
  {
    mode = 'full', // Valid values: full, safe, overs
  } = {},
) => {

  if (reviewInputs) {
    const reviewResponse = await collabsInventoryReviewOnHand(store, reviewInputs);
    const { success: reviewSuccess, result: reviewResult } = reviewResponse;
    if (!reviewSuccess) {
      return reviewResponse;
    }
    reviewOutputArray = reviewResult.array;
  }

  logDeep(reviewOutputArray);

  const shopifyInventoryQuantitiesSetPayloads = [];

  for (const item of reviewOutputArray) {
    const { 
      sku,
      shopifyOnHand,
      wmsOnHand, 
      oversellRisk,
      safeToImport,
      shopifyInventoryItemId,
      shopifyLocationId,
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
    !HOSTED && console.log(`Syncing ${ wmsOnHand } of ${ sku }, currently ${ shopifyOnHand }`);
    shopifyInventoryQuantitiesSetPayloads.push({
      inventoryItemId: `gid://shopify/InventoryItem/${ shopifyInventoryItemId }`,
      locationId: `gid://shopify/Location/${ shopifyLocationId }`,
      quantity: Number(wmsOnHand),
    });
  }
  
  !HOSTED && logDeep('shopifyInventoryQuantitiesSetPayloads', shopifyInventoryQuantitiesSetPayloads);
  !HOSTED && await askQuestion('?');

  const shopifyInventoryQuantitiesSetResponse = await shopifyInventoryQuantitiesSet(
    store,
    'on_hand',
    shopifyInventoryQuantitiesSetPayloads,
    'correction',
  );

  return shopifyInventoryQuantitiesSetResponse;  
};

const collabsInventorySyncV2Api = funcApi(collabsInventorySyncV2, {
  argNames: [
    'store',
    'reviewPayload', 
    'options',
  ],
});

module.exports = {
  collabsInventorySyncV2,
  collabsInventorySyncV2Api,
};

// curl localhost:8000/collabsInventorySyncV2 -H "Content-Type: application/json" -d '{ "store": "au", "reviewPayload": { "reviewInputs": { "minReportableDiff": 90, "allowSafeBelowDiff": false } } }'