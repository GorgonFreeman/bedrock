// Compares Shopify to respective WMS platforms to quantify inventory discrepancies

const { funcApi, logDeep, gidToId, arraySortByProp, arrayToObj, Timer, credsByPath } = require('../utils');

const {
  HOSTED,
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyLocationGetMain } = require('../shopify/shopifyLocationGetMain');
const { shopifyBulkOperationDo } = require('../shopify/shopifyBulkOperationDo');
const { shopifyVariantGet } = require('../shopify/shopifyVariantGet');

const { googlesheetsSpreadsheetSheetGetData } = require('../googlesheets/googlesheetsSpreadsheetSheetGetData');

const { shopifyRegionToPvxSite } = require('../mappings');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');

const { logiwaReportGetAvailableToPromise } = require('../logiwa/logiwaReportGetAvailableToPromise');
const { logiwaAsyncReportDo } = require('../logiwa/logiwaAsyncReportDo');

const { bleckmannInventoriesGet } = require('../bleckmann/bleckmannInventoriesGet');
const { bleckmannInventoryGet } = require('../bleckmann/bleckmannInventoryGet');

const SAMPLE_SIZE = 5;

const collabsInventoryReview = async (
  region,
  {
    skus,
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

  const variantQueryAttrs = `
    sku 
    inventoryQuantity 
    inventoryItem { 
      id 
      requiresShipping
      tracked
    }
  `;
  
  let shopifyVariants;

  if (skus) {

    const shopifyVariantsResponse = await shopifyVariantGet(
      region,
      skus.map(sku => ({ sku })), // variantIdentifier
      {
        attrs: variantQueryAttrs,
      },
    );

    const { success: shopifyVariantsSuccess, result: shopifyVariantsResult } = shopifyVariantsResponse;
    if (!shopifyVariantsSuccess) {
      return shopifyVariantsResponse;
    }

    shopifyVariants = shopifyVariantsResult;

  } else {

    const variantQuery = `{
      productVariants${ shopifyVariantsFetchQueries ? `(query: "${ shopifyVariantsFetchQueries.join(' AND ') }")` : '' } {
        edges {
          node {
            ${ variantQueryAttrs }
          }
        }
      }
    }`;
  
    const shopifyVariantsResponse = await shopifyBulkOperationDo(
      region,
      'query',
      variantQuery,
    );
  
    const { success: shopifyVariantsSuccess, result: shopifyVariantsResult } = shopifyVariantsResponse;
    if (!shopifyVariantsSuccess) {
      return shopifyVariantsResponse;
    }

    shopifyVariants = shopifyVariantsResult;

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
      
      
      /*
      const logiwaReportResponse = await logiwaReportGetAvailableToPromise(
        {
          
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

      if (skus) {

        // Regular paginated API

        const logiwaReportResponse = await logiwaReportGetAvailableToPromise(
          skus.map(sku => ({ 
            sku_eq: sku,
          })),
          {
            apiVersion: 'v3.2',
          },
        );

        let {
          success: logiwaReportSuccess,
          result: logiwaInventory,
        } = logiwaReportResponse;
        if (!logiwaReportSuccess) {
          return logiwaReportResponse;
        }

        logiwaInventory = logiwaInventory.flat();
    
        wmsInventoryObj = arrayToObj(logiwaInventory, { uniqueKeyProp: 'productSku', keepOnlyValueProp: 'sellableQuantity' });

      } else {

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
            filter: [
              `WarehouseIdentifier.eq=${ WAREHOUSE_ID }`,
              // 'UndamagedQuantity.gt=0', // TODO: Find out if there is a filter that can be used here to exclude 0 stock items
            ].join('&'),
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
    }

    if (bleckmannRelevant) {
      
      let bleckmannInventoryResponse;

      if (skus) {

        bleckmannInventoryResponse = await bleckmannInventoryGet(skus);

      } else {

        bleckmannInventoryResponse = await bleckmannInventoriesGet();

      }

      let {
        success: bleckmannInventorySuccess,
        result: bleckmannInventory,
      } = bleckmannInventoryResponse;
      if (!bleckmannInventorySuccess) {
        return bleckmannInventoryResponse;
      }

      if (skus) {
        bleckmannInventory = bleckmannInventory.map(i => i.data).flat();
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

    const shopifyAvailableNormalised = Math.max(shopifyAvailable, 0);
    const wmsInventoryNormalised = Math.max(wmsInventory, 0);

    const diff = shopifyAvailableNormalised - wmsInventoryNormalised;
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
  const biggestDiff = biggestDiffSample?.[0]?.absDiff;
  // Sort to put oversell risk at the top (more in Shopify than WMS)
  inventoryReviewArray = arraySortByProp(inventoryReviewArray, 'oversellRisk', { descending: true });
  const oversellRiskSample = inventoryReviewArray.slice(0, SAMPLE_SIZE).filter(i => i?.oversellRisk);
  const biggestOversellRisk = oversellRiskSample?.[0]?.absDiff;

  const metadata = {
    count: inventoryReviewArray.length,
    biggestDiff,
    oversellRiskCount: inventoryReviewArray.filter(item => item.oversellRisk).length,
    biggestOversellRisk,
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

const collabsInventoryReviewApi = funcApi(collabsInventoryReview, {
  argNames: ['region', 'options'],
});

module.exports = {
  collabsInventoryReview,
  collabsInventoryReviewApi,
};

// curl localhost:8000/collabsInventoryReview -H "Content-Type: application/json" -d '{ "region": "us", "options": { "shopifyVariantsFetchQueries": ["tag_not:not_for_radial", "published_status:published", "product_publication_status:approved"], "exportSheetIdentifier": { "spreadsheetIdentifier": { "spreadsheetHandle": "foxtron_stock_check" }, "sheetIdentifier": { "sheetName": "Sheet 1" } } } }'

// curl localhost:8100/collabsInventoryReview -H "Content-Type: application/json" -d '{ "region": "au", "options": { "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved", "tag_not:inv_hold"] } }'
// curl localhost:8101/collabsInventoryReview -H "Content-Type: application/json" -d '{ "region": "us", "options": { "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved", "tag_not:inv_hold_us", "tag_not:not_for_radial"] } }'
// curl localhost:8102/collabsInventoryReview -H "Content-Type: application/json" -d '{ "region": "uk", "options": { "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved", "tag_not:inv_hold_uk"] } }'

// curl localhost:8000/collabsInventoryReview -H "Content-Type: application/json" -d '{ "region": "au", "options": { "skus": ["EXDAL355-10-S/M", "EXD535-1-S/M", "EXDAL355-28-XS/S"] } }'