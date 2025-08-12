const { respond, mandateParam, logDeep } = require('../utils');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const yotpoCustomerAnniversaryGet = async ( 
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

const yotpoCustomerAnniversaryGetApi = async (req, res) => {
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

  const result = await yotpoCustomerAnniversaryGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  yotpoCustomerAnniversaryGet,
  yotpoCustomerAnniversaryGetApi,
};

// curl localhost:8000/yotpoCustomerAnniversaryGet -H "Content-Type: application/json" -d '{ "credsPath": "au" }'