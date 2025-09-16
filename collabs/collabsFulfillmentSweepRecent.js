const { funcApi } = require('../utils');
const {
  REGIONS_ALL,
} = require('../constants');

const collabsFulfillmentSweepRecent = async (
  {
    regions = REGIONS_ALL,
  } = {},
) => {

  return { 
    regions, 
  };
  
};

const collabsFulfillmentSweepRecentApi = funcApi(collabsFulfillmentSweepRecent, {
  argNames: ['options'],
});

module.exports = {
  collabsFulfillmentSweepRecent,
  collabsFulfillmentSweepRecentApi,
};

// curl localhost:8000/collabsFulfillmentSweepRecent -H "Content-Type: application/json" -d '{ "options": { "regions": ["au", "us"] } }'