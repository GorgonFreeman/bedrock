const { respond, mandateParam, logDeep } = require('../utils');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const yotpoCustomerAnniversaryGet = async ( 
  credsPath,
  customerEmail,
  {
    apiVersion,
  } = {},
) => {

  const response = await yotpoClient.fetch({
    url: `/customer_anniversary`,
    params: {
      customer_email: customerEmail,
    },
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
    customerEmail,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'customerEmail', customerEmail),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await yotpoCustomerAnniversaryGet(
    credsPath,
    customerEmail,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  yotpoCustomerAnniversaryGet,
  yotpoCustomerAnniversaryGetApi,
};

// curl localhost:8000/yotpoCustomerAnniversaryGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerEmail": "john+testing@whitefoxboutique.com" }'