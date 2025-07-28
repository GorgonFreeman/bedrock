const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17Get } = require('../pipe17/pipe17.utils');

const pipe17FulfillmentsGet = async (
  {
    credsPath,
    // TODO: Add query params
    ...getterOptions
  } = {},
) => {

  const response = await pipe17Get(
    '/fulfillments', 
    'fulfillments', 
    {
      credsPath,
      ...getterOptions,
    },
  );

  logDeep(response);
  return response;
};

const pipe17FulfillmentsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await pipe17FulfillmentsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17FulfillmentsGet,
  pipe17FulfillmentsGetApi,
};

// curl localhost:8000/pipe17FulfillmentsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 300 } }'