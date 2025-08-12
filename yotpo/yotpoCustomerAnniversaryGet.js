const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const yotpoCustomerAnniversaryGet = async ( 
  credsPath,
  {
    customerId,
    customerEmail,
  },
  {
    apiVersion,
  } = {},
) => {

  const response = await yotpoClient.fetch({
    url: `/customer_anniversary`,
    body: {
      ...customerId && { customer_id: customerId },
      ...customerEmail && { customer_email: customerEmail },
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
    customerIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'customerIdentifier', customerIdentifier, p => objHasAny(p, ['customerId', 'customerEmail'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await yotpoCustomerAnniversaryGet(
    credsPath,
    customerIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  yotpoCustomerAnniversaryGet,
  yotpoCustomerAnniversaryGetApi,
};

// curl localhost:8000/yotpoCustomerAnniversaryGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerIdentifier": { "customerEmail": "john+testing@whitefoxboutique.com" } }'