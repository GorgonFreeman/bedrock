// https://shopify.dev/docs/api/admin-graphql/latest/queries/orders

const { funcApi, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const defaultAttrs = `id name`;

const shopifyLocationsGet = async (
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

const shopifyLocationsGetApi = funcApi(shopifyLocationsGet, {
  argNames: ['credsPath', 'options'],
});

module.exports = {
  shopifyLocationsGet,
  shopifyLocationsGetApi,
};

// curl localhost:8000/shopifyLocationsGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'