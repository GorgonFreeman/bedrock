// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customerUpdate

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id firstName lastName email phone`;

const shopifyCustomerUpdate = async (
  credsPath,
  customerInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'customerUpdate',
    {
      input: {
        type: 'CustomerInput!',
        value: customerInput,
      },
    },
    `customer { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyCustomerUpdateApi = async (req, res) => {
  const {
    credsPath,
    customerInput,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'customerInput', customerInput),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyCustomerUpdate(
    credsPath,
    customerInput,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCustomerUpdate,
  shopifyCustomerUpdateApi,
};

// curl http://localhost:8000/shopifyCustomerUpdate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerInput": { ... }, "options": { "returnAttrs": "id" } }'