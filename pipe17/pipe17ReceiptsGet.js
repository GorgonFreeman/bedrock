// https://apidoc.pipe17.com/#/operations/fetchReceipts

const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17Get } = require('../pipe17/pipe17.utils');

const pipe17ReceiptsGet = async (
  {
    credsPath,
    // TODO: Add query params
    ...getterOptions
  } = {},
) => {

  const response = await pipe17Get(
    '/receipts', 
    'receipts', 
    {
      credsPath,
      ...getterOptions,
    },
  );

  logDeep(response);
  return response;
};

const pipe17ReceiptsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await pipe17ReceiptsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ReceiptsGet,
  pipe17ReceiptsGetApi,
};

// curl localhost:8000/pipe17ReceiptsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 300 } }'