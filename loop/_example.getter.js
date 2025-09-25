const { funcApi, logDeep } = require('../utils');
const { loopGet } = require('../loop/loop.utils');

const FUNC = async (
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

const FUNCApi = funcApi(FUNC, {
  argNames: ['credsPath'],
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 20, "perPage": 7 } }'