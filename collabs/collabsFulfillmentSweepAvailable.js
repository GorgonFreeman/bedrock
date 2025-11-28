const { funcApi } = require('../utils');

const collabsFulfillmentSweepAvailable = async (
  arg,
  {
    option,
  } = {},
) => {

  return { 
    arg, 
    option,
  };
  
};

const collabsFulfillmentSweepAvailableApi = funcApi(collabsFulfillmentSweepAvailable, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsFulfillmentSweepAvailable,
  collabsFulfillmentSweepAvailableApi,
};

// curl localhost:8000/collabsFulfillmentSweepAvailable -H "Content-Type: application/json" -d '{ "arg": "1234" }'