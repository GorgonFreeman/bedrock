const { funcApi, logDeep } = require('../utils');

const {
  HOSTED,
  REGIONS_WF,
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { stylearcadeDataGet } = require('../stylearcade/stylearcadeDataGet');

const { shopifyProductGet } = require('../shopify/shopifyProductGet');

const collabsProductDataCheck = async (
  sku,
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
  const stylearcadeDataResponse = await stylearcadeDataGet(sku);
  let { success: stylearcadeDataResponseSuccess, result: stylearcadeData } = stylearcadeDataResponse;
  if (!stylearcadeDataResponseSuccess) {
    return {
      success: false,
      message: 'Error getting stylearcade data',
    };
  }

  // Filter Stylearcade data to get the target product
  const targetStylearcadeData = stylearcadeData
  .map(({ data }) => data).filter(item => item) // remove data: null
  .filter(item => item.productId === sku); // filter wanted products

  if (targetStylearcadeData.length === 0) {
    return {
      success: false,
      message: `Product with SKU: ${ sku } not found in StyleArcade`,
    };
  }

  if (targetStylearcadeData.length > 1) {
    return {
      success: false,
      message: `Multiple products found in StyleArcade for SKU: ${ sku }`,
    };
  }

  const targetProduct = targetStylearcadeData[0];
  const weight = targetProduct.workflow.find(item => item.stageLabel === 'weight').note || null;
  const dimensions = targetProduct.workflow.find(item => item.stageLabel === 'product dims').note || null;

  let success  = true;
  let resultObject = {
    sku,
    stylearcadeData: {
      weight,
      dimensions,
    },
    shopifyData: {},
  };

  // Fetch and compile Shopify product data
  for (const region of regions) {
    const shopifyProductResponse = await shopifyProductGet(region, {
      skuStartsWith: `${ sku }-`,
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
  argNames: ['sku', 'options'],
});

module.exports = {
  collabsProductDataCheck,
  collabsProductDataCheckApi,
};

// curl localhost:8000/collabsProductDataCheck -H "Content-Type: application/json" -d '{ "sku": "WFT2212-1" }'
// curl localhost:8000/collabsProductDataCheck -H "Content-Type: application/json" -d '{ "sku": "WFT2212-1", "options": { "regions": [ "au" ] } }'
// curl localhost:8000/collabsProductDataCheck -H "Content-Type: application/json" -d '{ "sku": "WFT2212-1", "options": { "regions": [ "us" ] } }'
// curl localhost:8000/collabsProductDataCheck -H "Content-Type: application/json" -d '{ "sku": "WFT2212-1", "options": { "regions": [ "uk" ] } }'