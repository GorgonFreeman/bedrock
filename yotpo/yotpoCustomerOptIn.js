const { funcApi, logDeep } = require('../utils');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const yotpoCustomerOptIn = async ( 
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

const yotpoCustomerOptInApi = funcApi(yotpoCustomerOptIn, {
  argNames: ['credsPath', 'options'],
});

module.exports = {
  yotpoCustomerOptIn,
  yotpoCustomerOptInApi,
};

// curl localhost:8000/yotpoCustomerOptIn -H "Content-Type: application/json" -d '{ "credsPath": "au" }'