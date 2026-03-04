// https://shopify.dev/docs/api/admin-graphql/latest/queries/metafieldDefinitions

const { funcApi, logDeep } = require('../utils');
const { shopifyGet, shopifyGetter } = require('../shopify/shopify.utils');

const defaultAttrs = `id name namespace key`;

const payloadMaker = (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => {
  return [
    credsPath, 
    'metafieldDefinition',
    { 
      attrs, 
      ...options,
    },
  ];
};

const shopifyMetafieldDefinitionsGet = async (...args) => {
  const response = await shopifyGet(...payloadMaker(...args));
  return response;
};

const shopifyMetafieldDefinitionsGetter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const shopifyMetafieldDefinitionsGetApi = funcApi(shopifyMetafieldDefinitionsGet, {
  argNames: ['credsPath', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
  },
});

module.exports = {
  shopifyMetafieldDefinitionsGet,
  shopifyMetafieldDefinitionsGetter,
  shopifyMetafieldDefinitionsGetApi,
};

// curl localhost:8000/shopifyMetafieldDefinitionsGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'