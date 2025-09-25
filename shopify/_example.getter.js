// https://shopify.dev/docs/api/admin-graphql/latest/queries/orders

const { funcApi, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const defaultAttrs = `id name`;

const FUNC = async (
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

const FUNCApi = funcApi(FUNC, {
  argNames: ['credsPath'],
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'