const { funcApi } = require('../utils');

const collabsFulfillmentSweepRecent = async (
  regions,
  {
    option,
  } = {},
) => {

  return { 
    regions, 
    option,
  };
  
};

const collabsFulfillmentSweepRecentApi = funcApi(collabsFulfillmentSweepRecent, {
  argNames: ['regions', 'options'],
  validatorsByArg: {
    regions: Array.isArray,
  },
});

module.exports = {
  collabsFulfillmentSweepRecent,
  collabsFulfillmentSweepRecentApi,
};

// curl localhost:8000/collabsFulfillmentSweepRecent -H "Content-Type: application/json" -d '{ "regions": ["au", "us"] }'