// https://shopify.dev/docs/api/admin-graphql/latest/queries/orders

const { funcApi, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const defaultAttrs = `id name`;

const shopifyProcessRefunds = async (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => {

  const response = await shopifyGet(
    credsPath, 
    'order', 
    {
      attrs,
      ...options,
    },
  );

  return response;
};

const shopifyProcessRefundsApi = funcApi(shopifyProcessRefunds, {
  argNames: ['credsPath', 'options'],
});

module.exports = {
  shopifyProcessRefunds,
  shopifyProcessRefundsApi,
};

// curl localhost:8000/shopifyProcessRefunds -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'