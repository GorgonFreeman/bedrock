const { respond, mandateParam } = require('../utils');

const pipe17ProductGet = async (
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

const pipe17ProductGetApi = async (req, res) => {
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

  const result = await pipe17ProductGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ProductGet,
  pipe17ProductGetApi,
};

// curl localhost:8000/pipe17ProductGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'