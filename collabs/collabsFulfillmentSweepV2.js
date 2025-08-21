const { respond, mandateParam } = require('../utils');

const collabsFulfillmentSweepV2 = async (
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

const collabsFulfillmentSweepV2Api = async (req, res) => {
  const { 
    arg,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'arg', arg),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await collabsFulfillmentSweepV2(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsFulfillmentSweepV2,
  collabsFulfillmentSweepV2Api,
};

// curl localhost:8000/collabsFulfillmentSweepV2 -H "Content-Type: application/json" -d '{ "arg": "1234" }'