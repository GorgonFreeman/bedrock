const { respond, mandateParam, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitAddressesGet = async (
  credsPath,
  arg,
) => {

  const response = await starshipitClient.fetch({
    url: '/things',
    params: {
      arg_value: arg,
    },
    factoryArgs: [{ credsPath }],
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

const starshipitAddressesGetApi = async (req, res) => {
  const { 
    credsPath,
    arg,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'arg', arg),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await starshipitAddressesGet(
    credsPath,
    arg,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitAddressesGet,
  starshipitAddressesGetApi,
};

// curl localhost:8000/starshipitAddressesGet -H "Content-Type: application/json" -d '{ "credsPath": "wf", "arg": "408418809" }' 