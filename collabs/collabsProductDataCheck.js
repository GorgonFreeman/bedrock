const { funcApi } = require('../utils');

const {
  HOSTED,
  REGIONS_WF,
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const collabsProductDataCheck = async (
  sku,
  {
    regions = REGIONS_WF
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

  // Start product data check
  
};

const collabsProductDataCheckApi = funcApi(collabsProductDataCheck, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsProductDataCheck,
  collabsProductDataCheckApi,
};

// curl localhost:8000/collabsProductDataCheck -H "Content-Type: application/json" -d '{ "arg": "1234" }'