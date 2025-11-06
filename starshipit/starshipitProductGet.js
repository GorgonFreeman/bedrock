const { funcApi, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitProductGet = async (
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

const starshipitProductGetApi = funcApi(starshipitProductGet, {
  argNames: ['credsPath', 'arg', 'options'],
});

module.exports = {
  starshipitProductGet,
  starshipitProductGetApi,
};

// curl localhost:8000/starshipitProductGet -H "Content-Type: application/json" -d '{ "credsPath": "wf", "arg": "408418809" }' 