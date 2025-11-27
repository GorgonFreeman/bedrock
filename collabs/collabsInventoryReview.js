// Compares Shopify to respective WMS platforms to quantify inventory discrepancies

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { json2csv } = require('json-2-csv');
const { HOSTED } = require('../constants');
const { respond, mandateParam, logDeep, askQuestion, strictlyFalsey, arraySortByProp, gidToId } = require('../utils');

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

const collabsInventoryReview = async (
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
  
  const inventoryReviewObject = {};
  for (const variant of shopifyInventory) {
    const { 
      sku, 
      // inventoryQuantity, 
      inventoryItem,
    } = variant;

    const shopifyAvailable = inventoryItem?.inventoryLevel?.quantities?.find(quantity => quantity.name === 'available')?.quantity || 0;

    inventoryReviewObject[sku] = {
      shopifyAvailable,
    };
  }
  // logDeep('inventoryReviewObject', inventoryReviewObject);
  // await askQuestion('?');

  if (wmsExportSpreadsheetIdentifier && wmsExportSheetIdentifier) {
    const wmsExportResponse = await googlesheetsSpreadsheetSheetGetData(
      wmsExportSpreadsheetIdentifier,
      wmsExportSheetIdentifier,
    );

    const { success: sheetSuccess, result: wmsExport } = wmsExportResponse;
    if (!sheetSuccess) {
      return wmsExportResponse;
    }

    logDeep('wmsExport', wmsExport);
  }

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

    // logDeep('logiwaInventory', logiwaInventory);
    // await askQuestion('?');

    for (const inventoryItem of logiwaInventory) {
      const { 
        productSku: sku, 
        sellableQuantity,
      } = inventoryItem;

      if (!inventoryReviewObject[sku]) {
        continue;
      }

      if (inventoryReviewObject[sku].logiwaSellable) {
        inventoryReviewObject[sku].logiwaSellable += sellableQuantity;
        continue;
      }

      inventoryReviewObject[sku].logiwaSellable = sellableQuantity;
    }

    for (const [key, value] of Object.entries(inventoryReviewObject)) {

      if (strictlyFalsey(inventoryReviewObject[key].logiwaSellable)) {
        inventoryReviewObject[key].logiwaSellable = 0;
      }

      const { shopifyAvailable, logiwaSellable } = value;

      const diff = shopifyAvailable - logiwaSellable;
      inventoryReviewObject[key].logiwaOversellRisk = diff > 0;
      inventoryReviewObject[key].logiwaDiff = Math.abs(diff);
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
  
    console.log(pvxInventoryResponse);

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
        'Available': pvxAvailable,
      } = inventoryItem;

      if (!inventoryReviewObject[sku]) {
        continue;
      }

      inventoryReviewObject[sku].pvxAvailable = pvxAvailable;
    }

    for (const [key, value] of Object.entries(inventoryReviewObject)) {

      if (strictlyFalsey(inventoryReviewObject[key].pvxAvailable)) {
        inventoryReviewObject[key].pvxAvailable = 0;
      }

      const { shopifyAvailable, pvxAvailable } = value;

      const diff = shopifyAvailable - pvxAvailable;
      inventoryReviewObject[key].pvxOversellRisk = diff > 0;
      inventoryReviewObject[key].pvxDiff = Math.abs(diff);
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

      if (!inventoryReviewObject[sku] || inventoryType !== 'OK1') {
        continue;
      }

      const bleckmannAvailable = quantityTotal - quantityLocked;
      inventoryReviewObject[sku].bleckmannAvailable = bleckmannAvailable;
    }

    for (const [key, value] of Object.entries(inventoryReviewObject)) {

      if (strictlyFalsey(inventoryReviewObject[key].bleckmannAvailable)) {
        inventoryReviewObject[key].bleckmannAvailable = 0;
      }

      const { shopifyAvailable, bleckmannAvailable } = value;

      const diff = shopifyAvailable - bleckmannAvailable;
      inventoryReviewObject[key].bleckmannOversellRisk = diff > 0;
      inventoryReviewObject[key].bleckmannDiff = Math.abs(diff);
    }
  }

  logDeep('inventoryReviewObject', inventoryReviewObject);

  let inventoryReviewArray = Object.entries(inventoryReviewObject).map(([key, value]) => {
    return {
      sku: key,
      ...value,
    };
  });
 
  const exampleItem = inventoryReviewArray?.[0];
  const exampleItemKeys = Object.keys(exampleItem);

  const diffProp = exampleItemKeys?.find(key => key.toLowerCase().includes('diff'));
  const oversellRiskProp = exampleItemKeys?.find(key => key.toLowerCase().includes('oversellrisk'));
  
  // Sort biggest to smallest diff
  inventoryReviewArray = arraySortByProp(inventoryReviewArray, diffProp, { descending: true });
  // Filter out < min diff
  inventoryReviewArray = inventoryReviewArray.filter(item => item[diffProp] >= minReportableDiff);
  // Sort to put oversell risk at the top (more in Shopify than WMS)
  inventoryReviewArray = arraySortByProp(inventoryReviewArray, oversellRiskProp, { descending: true });

  if (downloadCsv) {
    const csv = await json2csv(inventoryReviewArray);
    const downloadsPath = process.env.DOWNLOADS_PATH || '.';
    const filePath = path.join(downloadsPath, 'collabsInventoryReview.csv');
    fs.writeFileSync(filePath, csv);
    
    // Open the downloads folder once the file is complete
    const { exec } = require('child_process');
    exec(`open "${ downloadsPath }"`);
  }

  return { 
    success: true, 
    result: {
      object: inventoryReviewObject,
      array: inventoryReviewArray,
    },
  };
  
};

const collabsInventoryReviewApi = async (req, res) => {
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

  const result = await collabsInventoryReview(
    region,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsInventoryReview,
  collabsInventoryReviewApi,
};

// curl localhost:8000/collabsInventoryReview -H "Content-Type: application/json" -d '{ "region": "us" }'
// curl localhost:8000/collabsInventoryReview -H "Content-Type: application/json" -d '{ "region": "us", "options": { "shopifyVariantsFetchQueries": ["tag_not:not_for_radial", "published_status:published", "product_publication_status:approved"], "minReportableDiff": 3, "downloadCsv": true } }'