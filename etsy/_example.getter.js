const { funcApi, logDeep } = require('../utils');
const { etsyGet } = require('../etsy/etsy.utils');

const FUNC = async (
  {
    credsPath,
    perPage,
    ...getterOptions
  } = {},
) => {
  const response = await etsyGet(
    '/application/listings/active',
    { 
      context: {
        credsPath,
      },
      ...(perPage && { perPage }),
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const FUNCApi = funcApi(FUNC, {
  argNames: [],
  validatorsByArg: {},
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC 
// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "options": { "limit": 600 } }'