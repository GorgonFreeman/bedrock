// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customerDelete

const { respond, mandateParam, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const shopifyCustomerDeleteSingle = async (
  credsPath,
  customerId,
  {
    apiVersion,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'customerDelete',
    {
      input: {
        type: 'CustomerDeleteInput!',
        value: {
          id: `gid://shopify/Customer/${ customerId }`,
        },
      },
    },
    `deletedCustomerId`,
    { 
      apiVersion,
    },
  );
  // logDeep(response);
  return response;
};

const shopifyCustomerDelete = async (
  credsPath,
  customerId,
  options,
) => {

  const response = await actionMultipleOrSingle(
    customerId,
    shopifyCustomerDeleteSingle,
    (customerId) => ({ 
      args: [credsPath, customerId], 
      options, 
    }),
  );
  logDeep(response);
  return response;
};

const shopifyCustomerDeleteApi = async (req, res) => {
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

  const result = await shopifyCustomerDelete(
    credsPath,
    customerId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCustomerDelete,
  shopifyCustomerDeleteApi,
};

// curl http://localhost:8000/shopifyCustomerDelete -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerId": 8489669984328 }'