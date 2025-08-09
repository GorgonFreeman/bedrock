const { respond, mandateParam } = require('../utils');

const loopReturnGet = async (
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

const loopReturnGetApi = async (req, res) => {
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

  const result = await loopReturnGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  loopReturnGet,
  loopReturnGetApi,
};

// curl localhost:8000/loopReturnGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'