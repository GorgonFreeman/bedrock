const { respond, mandateParam } = require('../utils');

const logiwaOrderGet = async (
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

const logiwaOrderGetApi = async (req, res) => {
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

  const result = await logiwaOrderGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaOrderGet,
  logiwaOrderGetApi,
};

// curl localhost:8000/logiwaOrderGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'