const { respond, mandateParam } = require('../utils');

const pipe17ReturnGet = async (
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

const pipe17ReturnGetApi = async (req, res) => {
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

  const result = await pipe17ReturnGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ReturnGet,
  pipe17ReturnGetApi,
};

// curl localhost:8000/pipe17ReturnGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'