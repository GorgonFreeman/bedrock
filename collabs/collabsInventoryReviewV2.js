// Compares Shopify to respective WMS platforms to quantify inventory discrepancies

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { json2csv } = require('json-2-csv');
const { HOSTED } = require('../constants');
const { respond, mandateParam, logDeep, askQuestion, strictlyFalsey, arraySortByProp, gidToId } = require('../utils');

const SAMPLE_SIZE = 5;

const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyRegionToPvxSite } = require('../mappings');

const { shopifyBulkOperationDo } = require('../shopify/shopifyBulkOperationDo');
const { shopifyLocationGetMain } = require('../shopify/shopifyLocationGetMain');
const { logiwaReportGetAvailableToPromise } = require('../logiwa/logiwaReportGetAvailableToPromise');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');
const { bleckmannInventoriesGet } = require('../bleckmann/bleckmannInventoriesGet');
const { googlesheetsSpreadsheetSheetGetData } = require('../googlesheets/googlesheetsSpreadsheetSheetGetData');

const collabsInventoryReviewV2 = async (
  region,
  {
    downloadCsv = false,
    shopifyVariantsFetchQueries,
    minReportableDiff = 0,
    locationId,
    wmsExportSpreadsheetIdentifier,
    wmsExportSheetIdentifier,
  } = {},
) => {

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

  if (!locationId) {
    console.log(`${ region }: Using main location`);

    const locationResponse = await shopifyLocationGetMain(region);

    const { success: locationSuccess, result: location } = locationResponse;
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
            inventoryLevel(locationId: "gid://shopify/Location/${ locationId }") { 
              quantities(names: "available") { 
                name 
                quantity
              } 
            }
          }
        }
      }
    }
  }`;

  const shopifyInventoryResponse = await shopifyBulkOperationDo(
    region,
    'query',
    variantQuery,
  );

  logDeep('shopifyInventoryResponse', shopifyInventoryResponse);

  const { 
    success: shopifyInventorySuccess, 
    result: shopifyInventory,
  } = shopifyInventoryResponse;
  if (!shopifyInventorySuccess) {
    return shopifyInventoryResponse;
  }
  
  const shopifyInventoryObj = {};
  for (const variant of shopifyInventory) {
    const { 
      sku, 
      // inventoryQuantity, 
      inventoryItem,
    } = variant;

    const shopifyAvailable = inventoryItem?.inventoryLevel?.quantities?.find(quantity => quantity.name === 'available')?.quantity || 0;

    shopifyInventoryObj[sku] = shopifyAvailable;
  }

  // logDeep('shopifyInventoryObj', shopifyInventoryObj);
  // await askQuestion('?');
  
  const wmsInventoryObj = {};

  const usingExport = wmsExportSpreadsheetIdentifier && wmsExportSheetIdentifier;

  if (usingExport) {

    const canUseExport = [
      logiwaRelevant,
      bleckmannRelevant,
    ].some(Boolean);

    if (!canUseExport) {
      return {
        success: false,
        error: ['Region not supported for export'],
      };
    }

    const wmsExportResponse = await googlesheetsSpreadsheetSheetGetData(
      wmsExportSpreadsheetIdentifier,
      wmsExportSheetIdentifier,
    );

    const { success: sheetSuccess, result: wmsExport } = wmsExportResponse;
    if (!sheetSuccess) {
      return wmsExportResponse;
    }

    logDeep('wmsExport', wmsExport);

    if (logiwaRelevant) {
      for (const item of wmsExport) {
        const {
          'SKU': sku,
          'Current ATP': wmsQty,
        } = item;
  
        if (!sku || !wmsQty) {
          continue;
        }
  
        wmsInventoryObj[sku] = Number(wmsQty);
      }
    }

    if (bleckmannRelevant) {
      for (const item of wmsExport) {
        const {
          'INV_SKU_ID': sku,
          'INV_CONDITION_ID': condition,
          'INV_FREE_INV': wmsQty,
        } = item;
  
        if (!sku || !wmsQty) {
          continue;
        }

        if (condition !== 'OK1') {
          continue;
        }
  
        wmsInventoryObj[sku] = Number(wmsQty);
      }
    }

  } else {
    // Using API

    if (logiwaRelevant) {
      const logiwaInventoryResponse = await logiwaReportGetAvailableToPromise(
        {
          undamagedQuantity_gt: '0',
        },
        {
          apiVersion: 'v3.2',
        },
      );

      const {
        success: logiwaInventorySuccess,
        result: logiwaInventory,
      } = logiwaInventoryResponse;
      if (!logiwaInventorySuccess) {
        return logiwaInventoryResponse;
      }

      for (const inventoryItem of logiwaInventory) {
        const { 
          productSku: sku, 
          sellableQuantity: wmsQty,
        } = inventoryItem;

        if (wmsInventoryObj[sku]) {
          wmsInventoryObj[sku] += wmsQty;
          continue;
        }

        wmsInventoryObj[sku] = wmsQty;
      }
    }

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

      logDeep('pvxInventory', pvxInventory);

      for (const inventoryItem of pvxInventory) {
        const { 
          'Item code': sku, 
          'Available': wmsQty,
        } = inventoryItem;

        wmsInventoryObj[sku] = wmsQty;
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
        wmsInventoryObj[sku] = bleckmannAvailable;
      }
    }
  }
  
  const inventoryReviewObj = {};

  for (const [sku, shopifyQty] of Object.entries(shopifyInventoryObj)) {
    const wmsQty = wmsInventoryObj[sku] || 0; // If inventory wasn't found in WMS, set to 0
    const diff = shopifyQty - wmsQty;
    const oversellRisk = diff > 0;
    const absDiff = Math.abs(diff);
    const safeToImport = oversellRisk || shopifyQty === 0;

    inventoryReviewObj[sku] = {
      shopifyQty,
      wmsQty,
      oversellRisk,
      absDiff,
      safeToImport,
    };
  }

  let inventoryReviewArray = Object.entries(inventoryReviewObj).map(([sku, value]) => {
    return {
      sku,
      ...value,
    };
  });

  // Filter out < min diff
  inventoryReviewArray = inventoryReviewArray.filter(item => item.absDiff >= minReportableDiff);
  // Sort biggest to smallest diff
  inventoryReviewArray = arraySortByProp(inventoryReviewArray, 'absDiff', { descending: true });
  const biggestDiffSample = inventoryReviewArray.slice(0, SAMPLE_SIZE);
  // Sort to put oversell risk at the top (more in Shopify than WMS)
  inventoryReviewArray = arraySortByProp(inventoryReviewArray, 'oversellRisk', { descending: true });
  const oversellRiskSample = inventoryReviewArray.slice(0, SAMPLE_SIZE);

  // if (downloadCsv) {
  //   const csv = await json2csv(inventoryReviewArray);
  //   const downloadsPath = process.env.DOWNLOADS_PATH || '.';
  //   const filePath = path.join(downloadsPath, 'collabsInventoryReviewV2.csv');
  //   fs.writeFileSync(filePath, csv);
    
  //   // Open the downloads folder once the file is complete
  //   const { exec } = require('child_process');
  //   exec(`open "${ downloadsPath }"`);
  // }

  const metadata = {
    items: inventoryReviewArray.length,
    biggestDiff: inventoryReviewArray[0]?.absDiff,
    oversellRiskCount: inventoryReviewArray.filter(item => item.oversellRisk).length,
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

const collabsInventoryReviewV2Api = async (req, res) => {
  const { 
    region,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'region', region),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await collabsInventoryReviewV2(
    region,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsInventoryReviewV2,
  collabsInventoryReviewV2Api,
};

// curl localhost:8000/collabsInventoryReviewV2 -H "Content-Type: application/json" -d '{ "region": "us" }'
// curl localhost:8000/collabsInventoryReviewV2 -H "Content-Type: application/json" -d '{ "region": "us", "options": { "shopifyVariantsFetchQueries": ["tag_not:not_for_radial", "published_status:published", "product_publication_status:approved"], "minReportableDiff": 3, "downloadCsv": true } }'
// curl localhost:8000/collabsInventoryReviewV2 -H "Content-Type: application/json" -d '{ "region": "us", "options": { "shopifyVariantsFetchQueries": ["tag_not:not_for_radial", "published_status:published", "product_publication_status:approved"], "minReportableDiff": 3, "wmsExportSpreadsheetIdentifier": { "spreadsheetId": "1ICbx-3g7Kqhge_Wkt9fi_9m7NGjgOGCOBHyEf0i3mP8" }, "wmsExportSheetIdentifier": { "sheetName": "Sheet 1" } } }'

// curl localhost:8100/collabsInventoryReviewV2 -H "Content-Type: application/json" -d '{ "region": "au", "options": { "minReportableDiff": 3, "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved"] } }'
// curl localhost:8101/collabsInventoryReviewV2 -H "Content-Type: application/json" -d '{ "region": "us", "options": { "minReportableDiff": 3, "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved", "tag_not:not_for_radial"] } }'
// curl localhost:8102/collabsInventoryReviewV2 -H "Content-Type: application/json" -d '{ "region": "uk", "options": { "minReportableDiff": 3, "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved"] } }'

// curl localhost:8000/collabsInventoryReviewV2 -H "Content-Type: application/json" -d '{ "region": "us", "options": { "minReportableDiff": 3, "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved", "tag_not:not_for_radial"], "wmsExportSpreadsheetIdentifier": { "spreadsheetId": "1ICbx-3g7Kqhge_Wkt9fi_9m7NGjgOGCOBHyEf0i3mP8" }, "wmsExportSheetIdentifier": { "sheetName": "Logiwa" } } }'
// curl localhost:8000/collabsInventoryReviewV2 -H "Content-Type: application/json" -d '{ "region": "uk", "options": { "minReportableDiff": 3, "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved"], "wmsExportSpreadsheetIdentifier": { "spreadsheetId": "1ICbx-3g7Kqhge_Wkt9fi_9m7NGjgOGCOBHyEf0i3mP8" }, "wmsExportSheetIdentifier": { "sheetName": "Bleckmann" } } }'