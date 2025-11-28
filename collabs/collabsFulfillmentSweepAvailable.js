// Actions the fulfillments that are easiest to get from the WMS

const { funcApi } = require('../utils');

const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const collabsFulfillmentSweepAvailable = async (
  region,
  {
    option,
  } = {},
) => {

  const pvxRelevant = REGIONS_PVX.includes(region);
  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  const bleckmannRelevant = REGIONS_BLECKMANN.includes(region);
  const anyRelevant = [
    // pvxRelevant, 
    // logiwaRelevant, 
    bleckmannRelevant,
  ].some(Boolean);

  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }

  return { 
    region, 
    option,
  };
  
};

const collabsFulfillmentSweepAvailableApi = funcApi(collabsFulfillmentSweepAvailable, {
  argNames: ['region', 'options'],
});

module.exports = {
  collabsFulfillmentSweepAvailable,
  collabsFulfillmentSweepAvailableApi,
};

// curl localhost:8000/collabsFulfillmentSweepAvailable -H "Content-Type: application/json" -d '{ "region": "uk" }'