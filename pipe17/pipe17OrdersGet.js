// https://apidoc.pipe17.com/#/operations/listOrders

const { funcApi, logDeep } = require('../utils');
const { pipe17Get } = require('../pipe17/pipe17.utils');

const pipe17OrdersGet = async (
  {
    credsPath,
    // TODO: Add query params
    ...getterOptions
  } = {},
) => {

  const response = await pipe17Get(
    '/orders', 
    'orders', 
    {
      credsPath,
      ...getterOptions,
    },
  );

  logDeep(response);
  return response;
};

const pipe17OrdersGetApi = funcApi(pipe17OrdersGet, {
  argNames: ['options'],
});

module.exports = {
  pipe17OrdersGet,
  pipe17OrdersGetApi,
};

// curl localhost:8000/pipe17OrdersGet -H "Content-Type: application/json" -d '{ "options": { "limit": 50 } }'