const { respond, mandateParam } = require('../utils');

const logiwaAuthGet = async (
  {
    credsPath,
  } = {},
) => {

  return true;
  
};

const logiwaAuthGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await logiwaAuthGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaAuthGet,
  logiwaAuthGetApi,
};

// curl localhost:8000/logiwaAuthGet