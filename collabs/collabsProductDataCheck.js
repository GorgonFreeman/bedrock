const { funcApi, logDeep } = require('../utils');

const {
  HOSTED,
  REGIONS_WF,
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { stylearcadeDataGet } = require('../stylearcade/stylearcadeDataGet');

const collabsProductDataCheck = async (
  sku,
  {
    regions = REGIONS_WF,
  } = {},
) => {

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

  const stylearcadeDataResponse = await stylearcadeDataGet(sku);
  let { success: stylearcadeDataResponseSuccess, result: stylearcadeData } = stylearcadeDataResponse;
  if (!stylearcadeDataResponseSuccess) {
    return {
      success: false,
      message: 'Error getting stylearcade data',
    };
  }

  const targetStylearcadeData = stylearcadeData
  .map(({ data }) => data).filter(item => item) // remove data: null
  .filter(item => item.productId === sku); // filter wanted products

  logDeep(targetStylearcadeData);

  return {
    success: true,
    result: targetStylearcadeData,
  }
  
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