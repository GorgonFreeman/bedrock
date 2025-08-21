const { funcApi } = require('../utils');

const { 
  REGIONS_LOGIWA,
} = require('../constants');

const collabsFulfillmentSweepV2 = async (
  region,
  {
    option,
  } = {},
) => {

  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  const anyRelevant = [logiwaRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }

  return {
    success: true,
  };
  
};

const collabsFulfillmentSweepV2Api = funcApi(collabsFulfillmentSweepV2, {
  argNames: ['region', 'options'],
  validatorsByArg: {
    region: Boolean,
  },
});

module.exports = {
  collabsFulfillmentSweepV2,
  collabsFulfillmentSweepV2Api,
};

// curl localhost:8000/collabsFulfillmentSweepV2 -H "Content-Type: application/json" -d '{ "region": "us" }'