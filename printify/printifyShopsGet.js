const { respond, mandateParam, logDeep } = require('../utils');
const { printifyGet } = require('../printify/printify.utils');

const printifyShopsGet = async (
  {
    credsPath,
  } = {},
) => {

  const response = await printifyGet(
    '/shops.json', 
    {
      verbose: true,
      credsPath,
    },
  );

  logDeep(response);
  return response;

};

const printifyShopsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await printifyShopsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyShopsGet,
  printifyShopsGetApi,
};

// curl localhost:8000/printifyShopsGet