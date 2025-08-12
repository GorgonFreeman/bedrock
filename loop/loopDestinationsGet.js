const { respond, mandateParam, logDeep } = require('../utils');
const { loopGet } = require('../loop/loop.utils');

const loopDestinationsGet = async (
  credsPath,
  {
    ...getterOptions
  } = {},
) => {

  const response = await loopGet(
    credsPath,
    '/destinations',
    'destinations',
    {
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const loopDestinationsGetApi = async (req, res) => {
  const { 
    credsPath,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await loopDestinationsGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  loopDestinationsGet,
  loopDestinationsGetApi,
};

// curl localhost:8000/loopDestinationsGet -H "Content-Type: application/json" -d '{ "credsPath": "au" }'