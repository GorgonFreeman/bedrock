// https://api-docs.starshipit.com/#ccf0f10f-e370-45c0-ba5c-13bfaac80ca6

const { funcApi, logDeep } = require('../utils');
const { starshipitGet } = require('../starshipit/starshipit.utils');

const starshipitProductsGet = async (
  credsPath,
  {
    ...getterOptions
  } = {},
) => {

  const response = await starshipitGet(
    credsPath,
    '/products',
    {
      // params,
      nodeName: 'products',
      ...getterOptions,
    },
  );

  logDeep(response);
  return response;
};

const starshipitProductsGetApi = funcApi(starshipitProductsGet, {
  argNames: ['credsPath'],
});

module.exports = {
  starshipitProductsGet,
  starshipitProductsGetApi,
};

// curl localhost:8000/starshipitProductsGet -H "Content-Type: application/json" -d '{ "credsPath": "wf" }' 