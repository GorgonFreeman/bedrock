const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17GetSingle } = require('../pipe17/pipe17GetSingle');

const pipe17ProductGet = async (
  productId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17GetSingle(
    'product',
    productId,
    {
      credsPath,
    },
  );  
  logDeep(response);
  return response;
};

const pipe17ProductGetApi = async (req, res) => {
  const { 
    productId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'productId', productId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17ProductGet(
    productId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ProductGet,
  pipe17ProductGetApi,
};

// curl localhost:8000/pipe17ProductGet -H "Content-Type: application/json" -d '{ "productId": "149a8a65ad5bca52" }'