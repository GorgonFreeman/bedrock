const { respond, mandateParam, logDeep } = require('../utils');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const yotpoCustomerGet = async ( 
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

const yotpoCustomerGetApi = async (req, res) => {
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

  const result = await yotpoCustomerGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  yotpoCustomerGet,
  yotpoCustomerGetApi,
};

// curl localhost:8000/yotpoCustomerGet -H "Content-Type: application/json" -d '{ "credsPath": "au" }'