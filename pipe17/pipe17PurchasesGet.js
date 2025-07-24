const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17Get } = require('../pipe17/pipe17.utils');

const pipe17PurchasesGet = async (
  {
    credsPath,
    // TODO: Add query params
    ...getterOptions
  } = {},
) => {

  const response = await pipe17Get(
    '/purchases', 
    'purchases', 
    {
      credsPath,
      ...getterOptions,
    },
  );

  logDeep(response);
  return response;
};

const pipe17PurchasesGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await pipe17PurchasesGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17PurchasesGet,
  pipe17PurchasesGetApi,
};

// curl localhost:8000/pipe17PurchasesGet -H "Content-Type: application/json" -d '{ "options": { "limit": 300 } }'