// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customerRequestDataErasure

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const shopifyCustomerRequestDataErasure = async (
  credsPath,
  customerId,
  {
    apiVersion,
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

const shopifyCustomerRequestDataErasureApi = funcApi(shopifyCustomerRequestDataErasure, {
  argNames: ['credsPath', 'customerId', 'options'],
});

module.exports = {
  shopifyCustomerRequestDataErasure,
  shopifyCustomerRequestDataErasureApi,
};

// curl http://localhost:8000/shopifyCustomerRequestDataErasure -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerId": "8659387940936" }'