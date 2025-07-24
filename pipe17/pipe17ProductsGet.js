const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17Get } = require('../pipe17/pipe17.utils');

const pipe17ProductsGet = async (
  {
    credsPath,
    // TODO: Add query params
    ...getterOptions
  } = {},
) => {

  const response = await pipe17Get(
    '/products', 
    'products', 
    {
      credsPath,
      ...getterOptions,
    },
  );

  logDeep(response);
  return response;
};

const pipe17ProductsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await pipe17ProductsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ProductsGet,
  pipe17ProductsGetApi,
};

// curl localhost:8000/pipe17ProductsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 300 } }'