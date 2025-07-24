const { respond, mandateParam } = require('../utils');

const pipe17LocationsGet = async (
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

const pipe17LocationsGetApi = async (req, res) => {
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

  const result = await pipe17LocationsGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17LocationsGet,
  pipe17LocationsGetApi,
};

// curl localhost:8000/pipe17LocationsGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'