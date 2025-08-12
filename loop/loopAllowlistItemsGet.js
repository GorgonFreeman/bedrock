const { respond, mandateParam, logDeep } = require('../utils');
const { loopGet } = require('../loop/loop.utils');

const loopAllowlistItemsGet = async (
  credsPath,
  {
    ...getterOptions
  } = {},
) => {

  const response = await loopGet(
    credsPath,
    '/allowlists',
    'data',
    {
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const loopAllowlistItemsGetApi = async (req, res) => {
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

  const result = await loopAllowlistItemsGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  loopAllowlistItemsGet,
  loopAllowlistItemsGetApi,
};

// curl localhost:8000/loopAllowlistItemsGet -H "Content-Type: application/json" -d '{ "credsPath": "au" }'