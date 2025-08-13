const { respond, mandateParam, logDeep, askQuestion } = require('../utils');

const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  // REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyVariantsGet } = require('../shopify/shopifyVariantsGet');

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

  logDeep(shopifyInventoryResponse);
  await askQuestion('?');

  const { 
    success: shopifyInventorySuccess, 
    result: shopifyInventory,
  } = shopifyInventoryResponse;
  if (!shopifyInventorySuccess) {
    return shopifyInventoryResponse;
  }

  return { 
    region, 
    option,
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

// curl localhost:8000/collabsInventoryReview -H "Content-Type: application/json" -d '{ "region": "au" }'