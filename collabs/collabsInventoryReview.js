// Compares Shopify to respective WMS platforms to quantify inventory discrepancies

const { respond, mandateParam, logDeep, askQuestion, strictlyFalsey, arraySortByProp } = require('../utils');

const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  // REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyRegionToPvxSite } = require('../mappings');

const { shopifyVariantsGet } = require('../shopify/shopifyVariantsGet');
const { logiwaReportGetAvailableToPromise } = require('../logiwa/logiwaReportGetAvailableToPromise');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');

const collabsInventoryReview = async (
  region,
  {
    option,
  } = {},
) => {

  const pvxRelevant = REGIONS_PVX.includes(region);
  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  
  const anyRelevant = [pvxRelevant, logiwaRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }

  const shopifyInventoryResponse = await shopifyVariantsGet(
    region,
    {
      attrs: 'sku inventoryQuantity',
    },
  );

  logDeep('shopifyInventoryResponse', shopifyInventoryResponse);
  await askQuestion('?');

  const { 
    success: shopifyInventorySuccess, 
    result: shopifyInventory,
  } = shopifyInventoryResponse;
  if (!shopifyInventorySuccess) {
    return shopifyInventoryResponse;
  }
  
  const inventoryReviewObject = {};
  for (const variant of shopifyInventory) {
    const { sku, inventoryQuantity } = variant;
    inventoryReviewObject[sku] = {
      shopifyAvailable: inventoryQuantity,
    };
  }
  logDeep('inventoryReviewObject', inventoryReviewObject);
  await askQuestion('?');

  if (logiwaRelevant) {
    const logiwaInventoryResponse = await logiwaReportGetAvailableToPromise(
      {
        undamagedQuantity_gt: '0',
      },
      {
        apiVersion: 'v3.2',
      },
    );
    logDeep('logiwaInventoryResponse', logiwaInventoryResponse);
    await askQuestion('?');

    const {
      success: logiwaInventorySuccess,
      result: logiwaInventory,
    } = logiwaInventoryResponse;
    if (!logiwaInventorySuccess) {
      return logiwaInventoryResponse;
    }

    logDeep('logiwaInventory', logiwaInventory);
    await askQuestion('?');

    for (const inventoryItem of logiwaInventory) {
      const { 
        productSku: sku, 
        undamagedQuantity,
      } = inventoryItem;

      if (!inventoryReviewObject[sku]) {
        continue;
      }

      if (inventoryReviewObject[sku].logiwaUndamaged) {
        inventoryReviewObject[sku].logiwaUndamaged += undamagedQuantity;
        continue;
      }

      inventoryReviewObject[sku].logiwaUndamaged = undamagedQuantity;
    }

    for (const [key, value] of Object.entries(inventoryReviewObject)) {

      if (strictlyFalsey(inventoryReviewObject[key].logiwaUndamaged)) {
        inventoryReviewObject[key].logiwaUndamaged = 0;
      }

      const { shopifyAvailable, logiwaUndamaged } = value;

      const diff = shopifyAvailable - logiwaUndamaged;
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

  logDeep('inventoryReviewObject', inventoryReviewObject);

  let inventoryReviewArray = Object.entries(inventoryReviewObject).map(([key, value]) => {
    return {
      sku: key,
      ...value,
    };
  });
  const diffProp = Object.keys(inventoryReviewArray?.[0])?.find(key => key.toLowerCase().includes('diff'));
  inventoryReviewArray = arraySortByProp(inventoryReviewArray, diffProp, { descending: true });
  logDeep('inventoryReviewArray', inventoryReviewArray);

  return { 
    success: true, 
    result: inventoryReviewObject,
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