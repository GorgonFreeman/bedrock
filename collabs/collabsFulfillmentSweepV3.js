const { funcApi } = require('../utils');

const collabsFulfillmentSweepV3 = async (
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

const collabsFulfillmentSweepV3Api = funcApi(collabsFulfillmentSweepV3, {
  argNames: ['arg'],
});

module.exports = {
  collabsFulfillmentSweepV3,
  collabsFulfillmentSweepV3Api,
};

// curl localhost:8000/collabsFulfillmentSweepV3 -H "Content-Type: application/json" -d '{ "arg": "1234" }'