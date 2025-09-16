const { respond, mandateParam } = require('../utils');

const collabsFulfillmentSweepRecent = async (
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

const collabsFulfillmentSweepRecentApi = async (req, res) => {
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

  const result = await collabsFulfillmentSweepRecent(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsFulfillmentSweepRecent,
  collabsFulfillmentSweepRecentApi,
};

// curl localhost:8000/collabsFulfillmentSweepRecent -H "Content-Type: application/json" -d '{ "arg": "1234" }'