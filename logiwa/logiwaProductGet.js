const { respond, mandateParam } = require('../utils');

const logiwaProductGet = async (
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

const logiwaProductGetApi = async (req, res) => {
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

  const result = await logiwaProductGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaProductGet,
  logiwaProductGetApi,
};

// curl localhost:8000/logiwaProductGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'