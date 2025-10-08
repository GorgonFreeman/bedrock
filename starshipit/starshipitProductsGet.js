const { funcApi, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitProductsGet = async (
  credsPath,
  arg,
) => {

  const response = await starshipitClient.fetch({
    url: '/things',
    params: {
      arg_value: arg,
    },
    context: {
      credsPath,
    },
    interpreter: (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.arg_value,
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const starshipitProductsGetApi = funcApi(starshipitProductsGet, {
  argNames: ['credsPath', 'arg'],
});

module.exports = {
  starshipitProductsGet,
  starshipitProductsGetApi,
};

// curl localhost:8000/starshipitProductsGet -H "Content-Type: application/json" -d '{ "credsPath": "wf", "arg": "408418809" }' 