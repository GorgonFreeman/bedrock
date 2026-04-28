// https://loyaltyapi.yotpo.com/reference/createupdate-customer-records

const { funcApi, logDeep } = require('../utils');
const { yotpoCustomerGet } = require('../yotpo/yotpoCustomerGet');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const yotpoCustomerOptIn = async ( 
  credsPath,
  {
    customerId,
    customerEmail,
    customerPhone,
    posAccountId,
  },
  {
    apiVersion = 'v2',
    countryCodeIso,
    optedIn = true,
  } = {},
) => {

  if (!customerEmail) {
    const customerGetResponse = await yotpoCustomerGet(credsPath, {
      ...(customerId && { customerId }),
      ...(customerPhone && { customerPhone }),
      ...(posAccountId && { posAccountId }),
    }, { apiVersion, countryCodeIso });
    const { success, result: customer } = customerGetResponse;
    if (!success) {
      return customerGetResponse;
    }
    customerEmail = customer.email;
  }

  const params = {
    email: customerEmail,
    opted_in: optedIn,
  }

  const response = await yotpoClient.fetch({
    url: `/customers`,
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

const yotpoCustomerOptInApi = funcApi(yotpoCustomerOptIn, {
  argNames: ['credsPath', 'customerIdentifier', 'options'],
});

module.exports = {
  yotpoCustomerOptIn,
  yotpoCustomerOptInApi,
};

// curl localhost:8000/yotpoCustomerOptIn -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerIdentifier": { "customerId": "8275235995720" } }'
// curl localhost:8000/yotpoCustomerOptIn -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerIdentifier": { "customerEmail": "zwe+test@whitefoxboutique.com" } }'
// curl localhost:8000/yotpoCustomerOptIn -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerIdentifier": { "customerEmail": "zwe+test@whitefoxboutique.com" }, "options": { "optedIn": false } }'