// https://shopify.dev/docs/api/admin-graphql/latest/queries/orders

const { funcApi, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const defaultAttrs = `id name`;

const shopifyCustomersGet = async (
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

const shopifyCustomersGetApi = funcApi(shopifyCustomersGet, {
  argNames: ['credsPath', 'options'],
});

module.exports = {
  shopifyCustomersGet,
  shopifyCustomersGetApi,
};

// curl localhost:8000/shopifyCustomersGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'