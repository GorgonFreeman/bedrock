const { respond, mandateParam } = require('../utils');

const pipe17ArrivalsGet = async (
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

const pipe17ArrivalsGetApi = async (req, res) => {
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

  const result = await pipe17ArrivalsGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ArrivalsGet,
  pipe17ArrivalsGetApi,
};

// curl localhost:8000/pipe17ArrivalsGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'