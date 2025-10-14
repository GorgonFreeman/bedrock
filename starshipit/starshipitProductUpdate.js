const { funcApi, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitProductUpdate = async (
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

const starshipitProductUpdateApi = funcApi(starshipitProductUpdate, {
  argNames: ['credsPath', 'arg', 'options'],
});

module.exports = {
  starshipitProductUpdate,
  starshipitProductUpdateApi,
};

// curl localhost:8000/starshipitProductUpdate -H "Content-Type: application/json" -d '{ "credsPath": "wf", "arg": "408418809" }' 