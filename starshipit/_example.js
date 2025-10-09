const { funcApi, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const FUNC = async (
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

const FUNCApi = funcApi(FUNC, {
  argNames: ['credsPath', 'arg', 'options'],
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "credsPath": "wf", "arg": "408418809" }' 