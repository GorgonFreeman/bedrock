const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17Get } = require('../pipe17/pipe17.utils');

const pipe17ArrivalsGet = async (
  {
    credsPath,
    // TODO: Add query params
    ...getterOptions
  } = {},
) => {

  const response = await pipe17Get(
    '/arrivals', 
    'arrivals', 
    {
      credsPath,
      ...getterOptions,
    },
  );

  logDeep(response);
  return response;
};

const pipe17ArrivalsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await pipe17ArrivalsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17ArrivalsGet,
  pipe17ArrivalsGetApi,
};

// curl localhost:8000/pipe17ArrivalsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 300 } }'