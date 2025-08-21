// Creates or updates a customer account, including marketing etc.
// Based on shopifyCustomerUpdateDetails in pebl

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const shopifyCustomerUpsert = async (
  credsPath,
  customerPayload,
  {
    apiVersion,
    returnAttrs = 'id email firstName lastName',
  } = {},
) => {

  return {
    success: false,
    result: customerPayload,
  };
};

const shopifyCustomerUpsertApi = funcApi(shopifyCustomerUpsert, { 
  argNames: ['credsPath', 'customerPayload', 'options'],
  validatorsByArg: { credsPath: Boolean, customerPayload: Boolean },
});

module.exports = {
  shopifyCustomerUpsert,
  shopifyCustomerUpsertApi,
};

// curl http://localhost:8000/shopifyCustomerUpsert -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerPayload": { ... } }'