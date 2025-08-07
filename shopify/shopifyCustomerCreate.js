// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customerCreate

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id email firstName lastName phone`;

const shopifyCustomerCreate = async (
  credsPath,
  customerInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'customerCreate',
    {
      input: {
        type: 'CustomerInput!',
        value: customerInput,
      },
    },
    `customer { ${ returnAttrs } }`,
    { 
      apiVersion,

      // client options
      interpreter: async (response) => {
        return {
          ...response,
          ...response?.result?.customer ? {
            result: response.result.customer,
          } : {},
        };
      },
    },
  );
  logDeep(response);
  return response;
};

const shopifyCustomerCreateApi = async (req, res) => {
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

  const result = await shopifyCustomerCreate(
    credsPath,
    customerInput,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCustomerCreate,
  shopifyCustomerCreateApi,
};

// curl http://localhost:8000/shopifyCustomerCreate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerInput": { "email": "john+shopifyCustomerCreate@whitefoxboutique.com", "firstName": "Doctor", "lastName": "Manhattan" } }'