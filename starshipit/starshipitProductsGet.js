// https://api-docs.starshipit.com/#ccf0f10f-e370-45c0-ba5c-13bfaac80ca6

const { funcApi, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitProductsGet = async (
  credsPath,
) => {

  const response = await starshipitClient.fetch({
    url: '/products',
    params: {
      // arg_value: arg,
    },
    context: {
      credsPath,
    },
    /*
    interpreter: (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.arg_value,
        } : {},
      };
    },
    */
  });

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