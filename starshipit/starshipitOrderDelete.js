const { respond, mandateParam, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitOrderDelete = async (
  credsPath,
  arg,
) => {

  const response = await starshipitClient.fetch({
    url: '/things',
    params: {
      arg_value: arg,
    },
    factoryArgs: [{ credsPath }],
  });

  logDeep(response);
  return response;
};

const starshipitOrderDeleteApi = async (req, res) => {
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

  const result = await starshipitOrderDelete(
    credsPath,
    arg,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitOrderDelete,
  starshipitOrderDeleteApi,
};

// curl localhost:8000/starshipitOrderDelete -H "Content-Type: application/json" -d '{ "credsPath": "wf", "arg": "408418809" }' 