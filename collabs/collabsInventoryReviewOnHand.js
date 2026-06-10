const { 
  HOSTED,
  REGIONS_PVX, 
} = require('../constants');
const { funcApi, gidToId, logDeep, arrayToObj } = require('../utils');

const { bedrock_unlisted_slackErrorPost } = require('../bedrock_unlisted/bedrock_unlisted_slackErrorPost');

const { shopifyLocationGetMain } = require('../shopify/shopifyLocationGetMain');
const { shopifyInventoryItemsGet } = require('../shopify/shopifyInventoryItemsGet');

const { shopifyRegionToPvxSite } = require('../mappings');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');

const collabsInventoryReviewOnHand = async (
  store,
  {
    locationId,
    minReportableDiff = 0,
  } = {},
) => {

  if (!REGIONS_PVX.includes(store)) {
    return {
      success: false,
      errors: [`${ store } not supported`],
    };
  }

  if (!locationId) {
    console.log(`${ store }: Using main location`);

    const locationResponse = await shopifyLocationGetMain(store);

    const { 
      success: locationSuccess, 
      result: location, 
    } = locationResponse;
    if (!locationSuccess) {
      return locationResponse;
    }

    if (!location) {
      return {
        success: false,
        errors: ['No location found'],
      };
    }

    const { id: locationGid } = location;
    locationId = gidToId(locationGid);
  }

  !HOSTED && logDeep('locationId', locationId);

  const inventoryItemsResponse = await shopifyInventoryItemsGet(store, {
    attrs: `
      id
      sku
      inventoryLevels(first: 50) {
        edges {
          node {
            location {
              id
              name
            }
            quantities(names: [
              "available",
              "on_hand",
            ]) {
              name
              quantity
            }
          }
        }
      }
    `,
  });

  const {
    success: inventoryItemsSuccess,
    result: inventoryItems,
  } = inventoryItemsResponse;
  if (!inventoryItemsSuccess) {
    return inventoryItemsResponse;
  }

  const inventoryDataObj = {};
  let wmsInventoryObj;

  for (const inventoryItem of inventoryItems) {
    const { 
      id: inventoryItemGid, 
      sku,
      inventoryLevels,
    } = inventoryItem;
    const inventoryItemId = gidToId(inventoryItemGid);
    // TODO: Handle unactivated inventory - this will show as a missing inventory level at that location. Default to 0 and support activation.
    const inventoryLevel = inventoryLevels.find(level => level.location.id === `gid://shopify/Location/${ locationId }`);
    const quantity = inventoryLevel.quantities.find(quantity => quantity.name === 'on_hand').quantity;
    inventoryDataObj[sku] = {
      shopifyOnHand: quantity,
      shopifyInventoryItemId: inventoryItemId,
      shopifyLocationId: locationId,
    };
  }

  if (REGIONS_PVX.includes(store)) {
    const pvxSite = shopifyRegionToPvxSite(store);

    if (!pvxSite) {
      return {
        success: false,
        error: [`No PVX site found for ${ store }`],
      };
    }
    
    // TODO: Consider fetching only >0 On Hand inventory and setting 0 for the rest
    const pvxInventoryResponse = await peoplevoxReportGet(
      'Item inventory summary', 
      {
        searchClause: `([Site reference].Equals("${ pvxSite }"))`, 
        columns: ['Item code', 'On hand'], 
      },
    );

    const {
      success: pvxReportSuccess,
      result: pvxInventory,
    } = pvxInventoryResponse;

    if (!pvxReportSuccess) {
      return pvxInventoryResponse;
    }

    wmsInventoryObj = arrayToObj(pvxInventory, { keyProp: 'Item code', keepOnlyValueProp: 'On hand' });
  }

  for (const [sku, wmsOnHandQuantity] of Object.entries(wmsInventoryObj)) {
    inventoryDataObj[sku] = inventoryDataObj[sku] || {};
    inventoryDataObj[sku].wmsOnHand = parseInt(wmsOnHandQuantity);
  }

  !HOSTED && logDeep('inventoryDataObj', inventoryDataObj);

  let inventoryReviewObj = {};

  for (const [sku, inventoryReviewItem] of Object.entries(inventoryDataObj)) {
    const {
      shopifyOnHand,
      wmsOnHand,
    } = inventoryReviewItem;

    const shopifyQtyNormalised = Math.max(shopifyOnHand, 0);
    const wmsQtyNormalised = Math.max(wmsOnHand, 0);

    const diff = shopifyQtyNormalised - wmsQtyNormalised;
    const absDiff = Math.abs(diff);

    const oversellRisk = diff > 0;
    const safeToImport = oversellRisk || shopifyQtyNormalised === 0;
    
    // If same as WMS, skip
    if (!(absDiff > 0)) {
      continue;
    }

    // Always report safe-to-import diffs, even if less than min diff.
    if (!safeToImport && absDiff < minReportableDiff) {
      continue;
    }

    inventoryReviewObj[sku] = {
      ...inventoryDataObj[sku],
      shopifyOnHand: shopifyQtyNormalised,
      wmsOnHand: wmsQtyNormalised,
      oversellRisk,
      absDiff,
      safeToImport,
    };
  }

  !HOSTED && logDeep('inventoryReviewObj', inventoryReviewObj);
  
  return { 
    success: true,
    result: {
      inventoryReviewObj,
    },
  };
  
};

const collabsInventoryReviewOnHandApi = funcApi(collabsInventoryReviewOnHand, {
  argNames: ['store', 'options'],
  validatorsByArg: {
    store: Boolean,
  },
  requireHostedApiKey: true,
  errorReporter: bedrock_unlisted_slackErrorPost,
});

module.exports = {
  collabsInventoryReviewOnHand,
  collabsInventoryReviewOnHandApi,
};

// curl localhost:8000/collabsInventoryReviewOnHand -H "Content-Type: application/json" -d '{ "store": "au" }'