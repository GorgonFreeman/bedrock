const { respond, mandateParam } = require('../utils');

const starshipitOrderGet = async (
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

const starshipitOrderGetApi = async (req, res) => {
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

  const result = await starshipitOrderGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitOrderGet,
  starshipitOrderGetApi,
};

// curl localhost:8000/starshipitOrderGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'