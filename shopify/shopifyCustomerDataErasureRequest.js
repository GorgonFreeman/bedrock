// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageCreate

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const shopifyCustomerDataErasureRequest = async (
  credsPath,
  customerId,
  {
    apiVersion = '2025-07',
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'customerRequestDataErasure',
    {
      customerId: {
        type: 'ID!',
        value: `gid://shopify/Customer/${ customerId }`,
      },
    },
    `customerId`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyCustomerDataErasureRequestApi = async (req, res) => {
  const {
    credsPath,
    customerId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'customerId', customerId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyCustomerDataErasureRequest(
    credsPath,
    customerId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCustomerDataErasureRequest,
  shopifyCustomerDataErasureRequestApi,
};

// curl http://localhost:8000/shopifyCustomerDataErasureRequest -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerId": 8765433348168 }'