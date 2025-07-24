const { respond, mandateParam } = require('../utils');

const pipe17ProductsGet = async (
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

const pipe17ProductsGetApi = async (req, res) => {
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

  const result = await pipe17ProductsGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ProductsGet,
  pipe17ProductsGetApi,
};

// curl localhost:8000/pipe17ProductsGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'