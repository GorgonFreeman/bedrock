const { funcApi, logDeep } = require('../utils');

const {
  HOSTED,
  REGIONS_WF,
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { stylearcadeProductGet } = require('../stylearcade/stylearcadeProductGet');

const { shopifyProductGet } = require('../shopify/shopifyProductGet');

const collabsProductDataCheck = async (
  skuTrunk,
  {
    regions = REGIONS_WF,
  } = {},
) => {

  // Validate regions
  const pvxRelevant = REGIONS_PVX.some(region => regions.includes(region));
  const logiwaRelevant = REGIONS_LOGIWA.some(region => regions.includes(region));
  const bleckmannRelevant = REGIONS_BLECKMANN.some(region => regions.includes(region));
  const anyRelevant = [pvxRelevant, logiwaRelevant, bleckmannRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }

  // Fetch Stylearcade data
  const stylearcadeDataResponse = await stylearcadeProductGet(skuTrunk);
  let { success: stylearcadeDataResponseSuccess, result: stylearcadeProduct } = stylearcadeDataResponse;
  if (!stylearcadeDataResponseSuccess) {
    return stylearcadeDataResponse;
  }

  const weight = stylearcadeProduct.workflow.find(item => item.stageLabel === 'weight').note || null;
  const dimensions = stylearcadeProduct.workflow.find(item => item.stageLabel === 'product dims').note || null;

  let success  = true;
  let resultObject = {
    skuTrunk,
    stylearcadeData: {
      weight,
      dimensions,
    },
    shopifyData: {},
  };

  // Fetch and compile Shopify product data
  for (const region of regions) {
    const shopifyProductResponse = await shopifyProductGet(region, {
      skuStartsWith: `${ skuTrunk }-`,
    }, {
      attrs: `id title handle
        dimensionsCmMetafield: metafield(namespace:"specifications", key:"dimensions_cm") { value }
        dimensionsInchesMetafield: metafield(namespace:"specifications", key:"dimensions_inches") { value }
        weightKgMetafield: metafield(namespace:"specifications", key:"weight_kg") { value }
        weightPoundsMetafield: metafield(namespace:"specifications", key:"weight_pounds") { value }
      `,
    });
    const { success: shopifyProductSuccess, result: shopifyProduct  } = shopifyProductResponse;
    if (!shopifyProductSuccess) {
      resultObject[region] = {
        error: shopifyProductResponse.error,
      };
      success = false;
      continue;
    }

    resultObject.shopifyData[region] = {
      dimensionsCm: shopifyProduct.dimensionsCmMetafield?.value,
      dimensionsInches: shopifyProduct.dimensionsInchesMetafield?.value,
      weightKg: shopifyProduct.weightKgMetafield?.value,
      weightPounds: shopifyProduct.weightPoundsMetafield?.value,
    };
  }

  !HOSTED && logDeep('resultObject', resultObject);

  return {
    success,
    result: {
      object: resultObject,
    },
  };
};

const collabsProductDataCheckApi = funcApi(collabsProductDataCheck, {
  argNames: ['skuTrunk', 'options'],
});

module.exports = {
  collabsProductDataCheck,
  collabsProductDataCheckApi,
};

// curl localhost:8000/collabsProductDataCheck -H "Content-Type: application/json" -d '{ "skuTrunk": "WFT2212-1" }'
// curl localhost:8000/collabsProductDataCheck -H "Content-Type: application/json" -d '{ "skuTrunk": "WFT2212-1", "options": { "regions": [ "au" ] } }'
// curl localhost:8000/collabsProductDataCheck -H "Content-Type: application/json" -d '{ "skuTrunk": "FSSH03-1", "options": { "regions": [ "us" ] } }'
// curl localhost:8000/collabsProductDataCheck -H "Content-Type: application/json" -d '{ "skuTrunk": "WFT2212-1", "options": { "regions": [ "uk" ] } }'