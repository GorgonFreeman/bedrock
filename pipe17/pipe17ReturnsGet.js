const { respond, mandateParam } = require('../utils');

const pipe17ReturnsGet = async (
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

const pipe17ReturnsGetApi = async (req, res) => {
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

  const result = await pipe17ReturnsGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ReturnsGet,
  pipe17ReturnsGetApi,
};

// curl localhost:8000/pipe17ReturnsGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'