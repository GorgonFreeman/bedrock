const { funcApi } = require('../utils');

const collabsFulfillmentSweepV2 = async (
  region,
  {
    option,
  } = {},
) => {

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