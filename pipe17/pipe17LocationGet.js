const { respond, mandateParam } = require('../utils');

const pipe17LocationGet = async (
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

const pipe17LocationGetApi = async (req, res) => {
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

  const result = await pipe17LocationGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17LocationGet,
  pipe17LocationGetApi,
};

// curl localhost:8000/pipe17LocationGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'