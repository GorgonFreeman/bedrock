const {
  HOSTED,
} = require('../constants');
const { funcApi, logDeep, askQuestion, objToArray, arrayToObj, objHasAll } = require('../utils');

const { collabsInventoryReviewOnHand, collabsInventoryReviewCalculateDiffs } = require('../collabs/collabsInventoryReviewOnHand');
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

  const hasExpectedKeys = reviewOutputArray.every(item => {
    return objHasAll(item, [
      'sku',
      'shopifyOnHand',
      'shopifyInventoryItemId',
      'shopifyLocationId',
      'wmsOnHand',
    ]);
  });

  if (!hasExpectedKeys) {
    return {
      success: false,
      error: ['Review output array is missing expected keys'],
    };
  }

  const needsCalculation = reviewOutputArray.every(item => {
    return !objHasAll(item, [
      'safeToImport', 
      'oversellRisk',
    ]);
  });

  if (needsCalculation) {
    console.log('needs calculation');
    const inventoryDataObj = arrayToObj(reviewOutputArray, { keyProp: 'sku' });
    const inventoryReviewObj = collabsInventoryReviewCalculateDiffs(inventoryDataObj);
    reviewOutputArray = objToArray(inventoryReviewObj, { keyProp: 'sku', spread: true });
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

/* 
curl localhost:8000/collabsInventorySyncV2 \
  -H "Content-Type: application/json" \
  -d '{
    "store": "au",
    "reviewPayload": {
      "reviewInputs": {
        "minReportableDiff": 90,
        "allowSafeBelowDiff": false
      }
    }
  }'

curl localhost:8000/collabsInventorySyncV2 \
  -H "Content-Type: application/json" \
  -d '{
    "store": "au",
    "reviewPayload": {
      "reviewOutputArray": [
        {
          "sku": "X-Y-1",
          "shopifyOnHand": 39,
          "shopifyInventoryItemId": "12345678",
          "shopifyLocationId": "12345678",
          "wmsOnHand": 41
        }
      ]
    }
  }'
*/
