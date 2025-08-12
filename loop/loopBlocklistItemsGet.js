const { respond, mandateParam, logDeep } = require('../utils');
const { loopGet } = require('../loop/loop.utils');

const loopBlocklistItemsGet = async (
  credsPath,
  {
    ...getterOptions
  } = {},
) => {

  const response = await loopGet(
    credsPath,
    '/warehouse/return/list',
    'returns',
    {
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const loopBlocklistItemsGetApi = async (req, res) => {
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

  const result = await loopBlocklistItemsGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  loopBlocklistItemsGet,
  loopBlocklistItemsGetApi,
};

// curl localhost:8000/loopBlocklistItemsGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 20, "perPage": 7 } }'