// A fulfillment sweep based on fulfillment orders, explicitly fulfilling payloads of line items wherever possible.

const { funcApi } = require('../utils');

const collabsFulfillmentSweepV5 = async (
  arg,
  {
    option,
  } = {},
) => {

  return { 
    arg,     option,
  };
  
};

const collabsFulfillmentSweepV5Api = funcApi(collabsFulfillmentSweepV5, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsFulfillmentSweepV5,
  collabsFulfillmentSweepV5Api,
};

// curl localhost:8000/collabsFulfillmentSweepV5 -H "Content-Type: application/json" -d '{ "arg": "1234" }'