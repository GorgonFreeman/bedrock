const { funcApi, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitProductAdd = async (
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

const starshipitProductAddApi = funcApi(starshipitProductAdd, {
  argNames: ['credsPath', 'arg', 'options'],
});

module.exports = {
  starshipitProductAdd,
  starshipitProductAddApi,
};

// curl localhost:8000/starshipitProductAdd -H "Content-Type: application/json" -d '{ "credsPath": "wf", "arg": "408418809" }' 