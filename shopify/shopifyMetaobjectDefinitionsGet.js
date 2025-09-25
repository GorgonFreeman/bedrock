// https://shopify.dev/docs/api/admin-graphql/latest/queries/orders

const { funcApi, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const defaultAttrs = `id name`;

const shopifyMetaobjectDefinitionsGet = async (
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

const shopifyMetaobjectDefinitionsGetApi = funcApi(shopifyMetaobjectDefinitionsGet, {
  argNames: ['credsPath'],
});

module.exports = {
  shopifyMetaobjectDefinitionsGet,
  shopifyMetaobjectDefinitionsGetApi,
};

// curl localhost:8000/shopifyMetaobjectDefinitionsGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'