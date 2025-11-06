// https://api-docs.starshipit.com/#5edb43f1-432b-4d1a-bb31-e05db0c879e3

const { funcApi, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitProductDelete = async (
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

const starshipitProductDeleteApi = funcApi(starshipitProductDelete, {
  argNames: ['credsPath', 'arg', 'options'],
});

module.exports = {
  starshipitProductDelete,
  starshipitProductDeleteApi,
};

// curl localhost:8000/starshipitProductDelete -H "Content-Type: application/json" -d '{ "credsPath": "wf", "arg": "408418809" }' 