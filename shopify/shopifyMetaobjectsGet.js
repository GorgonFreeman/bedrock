// https://shopify.dev/docs/api/admin-graphql/latest/queries/orders

const { funcApi, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const defaultAttrs = `id name`;

const shopifyMetaobjectsGet = async (
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

const shopifyMetaobjectsGetApi = funcApi(shopifyMetaobjectsGet, {
  argNames: ['credsPath'],
});

module.exports = {
  shopifyMetaobjectsGet,
  shopifyMetaobjectsGetApi,
};

// curl localhost:8000/shopifyMetaobjectsGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'