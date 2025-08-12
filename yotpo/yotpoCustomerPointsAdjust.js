// https://loyaltyapi.yotpo.com/reference/adjust-a-customers-point-balance

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const yotpoCustomerPointsAdjust = async ( 
  credsPath,
  {
    customerId,
    customerEmail,
  },
  
  {
    apiVersion,
  } = {},
) => {

  const params = {
    ...customerId && { customer_id: customerId },
    ...customerEmail && { customer_email: customerEmail },
  };

  const response = await yotpoClient.fetch({
    url: `/points/adjust`,
    method: 'post',
    params,
    context: {
      credsPath,
      apiVersion,
    },
  });
  logDeep(response);
  return response;
};

const yotpoCustomerPointsAdjustApi = async (req, res) => {
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

  const result = await yotpoCustomerPointsAdjust(
    credsPath,
    customerIdentifier,

    options,
  );
  respond(res, 200, result);
};

module.exports = {
  yotpoCustomerPointsAdjust,
  yotpoCustomerPointsAdjustApi,
};

// curl localhost:8000/yotpoCustomerPointsAdjust -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerIdentifier": { "customerEmail": "john+testing@whitefoxboutique.com" }, ... }'