const { funcApi, logDeep, gidToId, askQuestion, arrayToObj } = require('../utils');

const { shopifyVariantsGet } = require('../shopify/shopifyVariantsGet');
const { shopifyLocationsGet } = require('../shopify/shopifyLocationsGet');
const { shopifyInventoryQuantitiesSet } = require('../shopify/shopifyInventoryQuantitiesSet');

const { shopifyRegionToPvxSite } = require('../mappings');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');

const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const collabsInventorySync = async (
  region,
  {
    skus, // if provided, only sync these SKUs, and ignore other options.
    shopifyVariantsFetchQueries,
    minDiff = 0, // Only sync if the diff is greater than or equal to this value.
    safeMode, // Only sync if Shopify has more than the WMS, or, there is no stock in Shopify. These syncs are unlikely to cause oversells.
    locationId,
  } = {},
) => {

  if (skus) {
    return {
      success: false,
      errors: ['Inventory sync for a list of skus is not supported yet.'],
    };
  }

  const pvxRelevant = REGIONS_PVX.includes(region);
  // const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  // const bleckmannRelevant = REGIONS_BLECKMANN.includes(region);
  const anyRelevant = [
    pvxRelevant, 
    // logiwaRelevant, 
    // bleckmannRelevant,
  ].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      errors: ['Region not supported'],
    };
  }

  // Get the location ID
  // Get the Shopify inventory item IDs and stock
  // Get the WMS inventory

  // TODO: Convert to getters and processors

  if (!locationId) {
    const shopifyLocationsResponse = await shopifyLocationsGet(
      region,
      {
        attrs: 'id name',
      },
    );

    const { success: shopifyLocationsSuccess, result: shopifyLocations } = shopifyLocationsResponse;
    if (!shopifyLocationsSuccess) {
      return shopifyLocationsResponse;
    }
    
    // TODO: Implement logic to choose the correct location
    const location = shopifyLocations?.[0];

    if (!location) {
      return {
        success: false,
        errors: ['No location found'],
      };
    }

    const { id: locationGid } = location;
    locationId = gidToId(locationGid);
  }

  logDeep('locationId', locationId);

  const shopifyVariantsResponse = await shopifyVariantsGet(
    region,
    {
      attrs: `
        sku 
        inventoryQuantity 
        inventoryItem { 
          id 
          requiresShipping
          tracked
        }
      `,
      ...(shopifyVariantsFetchQueries ? { queries: shopifyVariantsFetchQueries } : {}),
    },
  );

  const { success: shopifyVariantsSuccess, result: shopifyVariants } = shopifyVariantsResponse;
  if (!shopifyVariantsSuccess) {
    return shopifyVariantsResponse;
  }
  
  let wmsInventoryObj;
  const shopifyInventoryQuantitiesSetPayloads = [];

  if (pvxRelevant) {
    const pvxSite = shopifyRegionToPvxSite(region);

    if (!pvxSite) {
      return {
        success: false,
        error: [`No PVX site found for ${ region }`],
      };
    }

    const pvxInventoryResponse = await peoplevoxReportGet(
      'Item inventory summary', 
      {
        searchClause: `([Site reference].Equals("${ pvxSite }"))`, 
        columns: ['Item code', 'Available'], 
      },
    );

    const {
      success: pvxReportSuccess,
      result: pvxInventory,
    } = pvxInventoryResponse;
    if (!pvxReportSuccess) {
      return pvxInventoryResponse;
    }

    wmsInventoryObj = arrayToObj(pvxInventory, { uniqueKeyProp: 'Item code', keepOnlyValueProp: 'Available' });
    logDeep('wmsInventoryObj', wmsInventoryObj);
  }

  for (const variant of shopifyVariants) {
    const { 
      sku, 
      inventoryQuantity: shopifyAvailable, 
      inventoryItem,
    } = variant;

    const {
      requiresShipping,
      tracked,
    } = inventoryItem;

    if (!requiresShipping || !tracked) {
      continue;
    }

    const wmsInventory = wmsInventoryObj[sku] || 0; // TODO: Reconsider using 0 if not found in WMS

    const diff = shopifyAvailable - wmsInventory;
    const oversellRisk = diff > 0;
    const absDiff = Math.abs(diff);
  
    // Always send oversell risks, even if less than min diff.
    if (!oversellRisk && absDiff < minDiff) {
      continue;
    }

    const safe = oversellRisk || shopifyAvailable === 0;
    if (safeMode && !safe) {
      continue;
    }

    const { id: inventoryItemGid } = inventoryItem;

    // Sync inventory
    console.log(`Syncing ${ wmsInventory } of ${ sku }, currently ${ shopifyAvailable }`);
    shopifyInventoryQuantitiesSetPayloads.push({
      inventoryItemId: inventoryItemGid,
      locationId: `gid://shopify/Location/${ locationId }`,
      quantity: wmsInventory,
    });
  }

  const shopifyInventoryQuantitiesSetResponse = await shopifyInventoryQuantitiesSet(
    region,
    shopifyInventoryQuantitiesSetPayloads,
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