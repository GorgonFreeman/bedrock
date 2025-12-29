const { funcApi, logDeep, gidToId, arraySortByProp, arrayToObj, Timer, credsByPath } = require('../utils');

const {
  HOSTED,
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyLocationGetMain } = require('../shopify/shopifyLocationGetMain');
const { shopifyBulkOperationDo } = require('../shopify/shopifyBulkOperationDo');

const { googlesheetsSpreadsheetSheetGetData } = require('../googlesheets/googlesheetsSpreadsheetSheetGetData');

const { shopifyRegionToPvxSite } = require('../mappings');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');

const { logiwaReportGetAvailableToPromise } = require('../logiwa/logiwaReportGetAvailableToPromise');
const { logiwaAsyncReportDo } = require('../logiwa/logiwaAsyncReportDo');

const { bleckmannInventoriesGet } = require('../bleckmann/bleckmannInventoriesGet');

const SAMPLE_SIZE = 5;

const collabsInventoryCompare = async (
  region,
  {
    shopifyVariantsFetchQueries,
    minReportableDiff = 0,
    locationId,
    exportSheetIdentifier,
  } = {},
) => {

  const timer = new Timer();

  const pvxRelevant = REGIONS_PVX.includes(region);
  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  const bleckmannRelevant = REGIONS_BLECKMANN.includes(region);
  const anyRelevant = [pvxRelevant, logiwaRelevant, bleckmannRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }
  
  // Check that region is appropriate if using export.
  // If it makes it through here, we can attempt using an export from a sheet.
  const usingExport = exportSheetIdentifier;
  if (exportSheetIdentifier) {
    const {
      spreadsheetIdentifier,
      sheetIdentifier,
    } = exportSheetIdentifier;

    if (!spreadsheetIdentifier || !sheetIdentifier) {
      return {
        success: false,
        errors: ['spreadsheetIdentifier and sheetIdentifier are required'],
      };
    }

    const canUseExport = [
      logiwaRelevant,
    ].some(Boolean);

    if (!canUseExport) {
      return {
        success: false,
        error: [`Region ${ region } not supported for export`],
      };
    }
  }

  if (!locationId) {
    console.log(`${ region }: Using main location`);

    const locationResponse = await shopifyLocationGetMain(region);

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

  const variantQuery = `{
    productVariants${ shopifyVariantsFetchQueries ? `(query: "${ shopifyVariantsFetchQueries.join(' AND ') }")` : '' } {
      edges {
        node {
          sku 
          inventoryQuantity 
          inventoryItem { 
            id 
            requiresShipping
            tracked
          }
        }
      }
    }
  }`;

  const shopifyVariantsResponse = await shopifyBulkOperationDo(
    region,
    'query',
    variantQuery,
  );

  const { success: shopifyVariantsSuccess, result: shopifyVariants } = shopifyVariantsResponse;
  if (!shopifyVariantsSuccess) {
    return shopifyVariantsResponse;
  }

  let wmsInventoryObj;

  if (usingExport) {

    const {
      spreadsheetIdentifier,
      sheetIdentifier,
    } = exportSheetIdentifier;

    const wmsExportResponse = await googlesheetsSpreadsheetSheetGetData(
      spreadsheetIdentifier,
      sheetIdentifier,
    );

    const { success: sheetSuccess, result: wmsExport } = wmsExportResponse;
    if (!sheetSuccess) {
      return wmsExportResponse;
    }

    if (logiwaRelevant) {
      // Export from: https://fasttrack.radial.com/en/wms/report/available-to-promise
      wmsInventoryObj = arrayToObj(wmsExport, { 
        uniqueKeyProp: 'SKU', 
        keepOnlyValueProp: 'Sellable Qty', 
      });
    }
    
  } else {

    // Using API

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
    }
  
    if (logiwaRelevant) {
      
      // Regular paginated API
      /*
      const logiwaReportResponse = await logiwaReportGetAvailableToPromise(
        {
          undamagedQuantity_gt: '0',
        },
        {
          apiVersion: 'v3.2',
        },
      );
  
      const {
        success: logiwaReportSuccess,
        result: logiwaInventory,
      } = logiwaReportResponse;
      if (!logiwaReportSuccess) {
        return logiwaReportResponse;
      }
  
      wmsInventoryObj = arrayToObj(logiwaInventory, { uniqueKeyProp: 'productSku', keepOnlyValueProp: 'sellableQuantity' });
      */

      
      // Async report

      const creds = credsByPath(['logiwa']);
      const { WAREHOUSE_ID } = creds;
      if (!WAREHOUSE_ID) {
        return {
          success: false,
          error: ['No warehouse ID found, add to logiwa creds'],
        };
      }

      const logiwaInventoryResponse = await logiwaAsyncReportDo(
        {
          reportTypeCode: 'available_to_promise',
          filter: `WarehouseIdentifier.eq=${ WAREHOUSE_ID }`,
        },
      );

      const {
        success: logiwaInventorySuccess,
        result: logiwaInventory,
      } = logiwaInventoryResponse;
      if (!logiwaInventorySuccess) {
        return logiwaInventoryResponse;
      }

      !HOSTED && logDeep('logiwaInventory', logiwaInventory);

      if (!logiwaInventory?.length) {
        return {
          success: false,
          errors: ['Logiwa inventory report messed up'],
        };
      }
      
      wmsInventoryObj = {};

      for (const inventoryItem of logiwaInventory) {
        const { 
          'ProductSku': sku, 
          'SellableQuantity': wmsQty,
        } = inventoryItem;

        wmsInventoryObj[sku] = wmsInventoryObj[sku] || 0;
        wmsInventoryObj[sku] += Number(wmsQty);
      }
    }

    if (bleckmannRelevant) {

      const bleckmannInventoryResponse = await bleckmannInventoriesGet();

      const {
        success: bleckmannInventorySuccess,
        result: bleckmannInventory,
      } = bleckmannInventoryResponse;
      if (!bleckmannInventorySuccess) {
        return bleckmannInventoryResponse;
      }

      // logDeep('bleckmannInventory', bleckmannInventory);
      // await askQuestion('?');
      
      wmsInventoryObj = {};
      for (const inventoryItem of bleckmannInventory) {
        const { 
          skuId: sku, 
          inventoryType,
          quantityTotal,
          quantityLocked,
        } = inventoryItem;
        
        // Avoid damaged inventory locations
        if (inventoryType !== 'OK1') {
          continue;
        }

        const bleckmannAvailable = quantityTotal - quantityLocked;
        wmsInventoryObj[sku] = wmsInventoryObj[sku] || 0;
        wmsInventoryObj[sku] += Number(bleckmannAvailable);
      }
    }
  }

  !HOSTED && logDeep('wmsInventoryObj', wmsInventoryObj);

  const inventoryReviewObj = {};

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
    const absDiff = Math.abs(diff);
    
    const oversellRisk = diff > 0;
    const safeToImport = oversellRisk || shopifyAvailable === 0;
    
    // If same as WMS, skip
    if (!(absDiff > 0)) {
      continue;
    }
  
    // Always report safe-to-import diffs, even if less than min diff.
    if (!safeToImport && absDiff < minReportableDiff) {
      continue;
    }

    const { id: inventoryItemGid } = inventoryItem;
    const inventoryItemId = gidToId(inventoryItemGid);

    inventoryReviewObj[sku] = {
      shopifyQty: shopifyAvailable,
      wmsQty: wmsInventory,
      oversellRisk,
      absDiff,
      safeToImport,

      // inventory item ID and location ID are included for syncing inventory without refetching
      inventoryItemId,
      locationId,
    };
  }

  let inventoryReviewArray = Object.entries(inventoryReviewObj).map(([sku, value]) => {
    return {
      sku,
      ...value,
    };
  });
  // Sort biggest to smallest diff
  inventoryReviewArray = arraySortByProp(inventoryReviewArray, 'absDiff', { descending: true });
  const biggestDiffSample = inventoryReviewArray.slice(0, SAMPLE_SIZE);
  // Sort to put oversell risk at the top (more in Shopify than WMS)
  inventoryReviewArray = arraySortByProp(inventoryReviewArray, 'oversellRisk', { descending: true });
  const oversellRiskSample = inventoryReviewArray.slice(0, SAMPLE_SIZE);

  const metadata = {
    count: inventoryReviewArray.length,
    biggestDiff: inventoryReviewArray[0]?.absDiff,
    oversellRiskCount: inventoryReviewArray.filter(item => item.oversellRisk).length,
    timeTaken: timer.getTime({ readable: true }),
  };
  logDeep('metadata', metadata);

  const samples = {
    biggestDiff: biggestDiffSample,
    oversellRisk: oversellRiskSample,
  };
  logDeep('samples', samples);

  return {
    success: true,
    result: {
      object: inventoryReviewObj,
      array: inventoryReviewArray,
      metadata,
      samples,
    },
  };
};

const collabsInventoryCompareApi = funcApi(collabsInventoryCompare, {
  argNames: ['region', 'options'],
});

module.exports = {
  collabsInventoryCompare,
  collabsInventoryCompareApi,
};

// curl localhost:8000/collabsInventoryCompare -H "Content-Type: application/json" -d '{ "region": "au", "options": { "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved"] } }'
// curl localhost:8001/collabsInventoryCompare -H "Content-Type: application/json" -d '{ "region": "us", "options": { "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved", "tag_not:not_for_radial"] } }'
// curl localhost:8002/collabsInventoryCompare -H "Content-Type: application/json" -d '{ "region": "uk", "options": { "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved"] } }'