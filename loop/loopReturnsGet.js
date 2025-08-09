const { respond, mandateParam } = require('../utils');

const loopReturnsGet = async (
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

const loopReturnsGetApi = async (req, res) => {
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

  const result = await loopReturnsGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  loopReturnsGet,
  loopReturnsGetApi,
};

// curl localhost:8000/loopReturnsGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'