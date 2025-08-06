// https://loyaltyapi.yotpo.com/reference/fetch-customer-details

const { respond, mandateParam, logDeep, objHasAny, strictlyFalsey } = require('../utils');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const yotpoCustomerGet = async ( 
  credsPath,
  {
    customerId,
    customerEmail,
    customerPhone,
    posAccountId,
  },
  {
    apiVersion,
    countryCodeIso,
    withReferralCode,
    withHistory,
  } = {},
) => {

  const params = {
    ...(customerId && { customer_id: customerId }),
    ...(customerEmail && { customer_email: customerEmail }),
    ...(customerPhone && { phone_number: customerPhone }),
    ...(posAccountId && { pos_account_id: posAccountId }),
    ...(countryCodeIso && { country_code_iso: countryCodeIso }),
    ...(!strictlyFalsey(withReferralCode) && { with_referral_code: withReferralCode }),
    ...(!strictlyFalsey(withHistory) && { with_history: withHistory }),
  };

  const response = await yotpoClient.fetch({
    url: `/customers`,
    params,
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
    customerIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'customerIdentifier', customerIdentifier, p => objHasAny(p, ['customerId', 'customerEmail', 'customerPhone', 'posAccountId'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await yotpoCustomerGet(
    credsPath,
    customerIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  yotpoCustomerGet,
  yotpoCustomerGetApi,
};

// curl localhost:8000/yotpoCustomerGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerIdentifier": { "customerEmail": "john@whitefoxboutique.com" } }'