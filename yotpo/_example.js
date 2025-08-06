const { respond, mandateParam, logDeep } = require('../utils');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const FUNC = async ( 
  credsPath,
  {
    apiVersion,
  } = {},
) => {

  const response = await yotpoClient.fetch({
    url: `/endpoint`,
    context: {
      credsPath,
      apiVersion,
    },
  });
  logDeep(response);
  return response;
};

const FUNCApi = async (req, res) => {
  const { 
    credsPath,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await FUNC(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "credsPath": "au" }'