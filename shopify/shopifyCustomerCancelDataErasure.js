// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customerCancelDataErasure

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const shopifyCustomerCancelDataErasure = async (
  credsPath,
  customerId,
  {
    apiVersion,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'customerCancelDataErasure',
    {
      customerId: {
        type: 'customerId!',
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

const shopifyCustomerCancelDataErasureApi = funcApi(shopifyCustomerCancelDataErasure, {
  argNames: ['credsPath', 'customerId', 'options'],
});

module.exports = {
  shopifyCustomerCancelDataErasure,
  shopifyCustomerCancelDataErasureApi,
};

// curl http://localhost:8000/shopifyCustomerCancelDataErasure -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerId": "8659387940936" }'