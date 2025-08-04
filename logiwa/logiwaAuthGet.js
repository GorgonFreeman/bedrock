const { respond, mandateParam } = require('../utils');

const logiwaAuthGet = async (
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

const logiwaAuthGetApi = async (req, res) => {
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

  const result = await logiwaAuthGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaAuthGet,
  logiwaAuthGetApi,
};

// curl localhost:8000/logiwaAuthGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'