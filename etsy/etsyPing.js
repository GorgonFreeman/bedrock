const { respond, mandateParam } = require('../utils');

const etsyPing = async (
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

const etsyPingApi = async (req, res) => {
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

  const result = await etsyPing(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyPing,
  etsyPingApi,
};

// curl localhost:8000/etsyPing -H "Content-Type: application/json" -d '{ "arg": "1234" }'