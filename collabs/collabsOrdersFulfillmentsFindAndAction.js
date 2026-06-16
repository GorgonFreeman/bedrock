const { funcApi } = require('../utils');

const collabsOrdersFulfillmentsFindAndAction = async (
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

const collabsOrdersFulfillmentsFindAndActionApi = funcApi(collabsOrdersFulfillmentsFindAndAction, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsOrdersFulfillmentsFindAndAction,
  collabsOrdersFulfillmentsFindAndActionApi,
};

// curl localhost:8000/collabsOrdersFulfillmentsFindAndAction -H "Content-Type: application/json" -d '{ "arg": "1234" }'