// https://shopify.dev/docs/api/admin-graphql/latest/queries/things

const { funcApi, logDeep } = require('../utils');
const { shopifyGet, shopifyGetter } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const payloadMaker = (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => {
  return [
    credsPath, 
    'thing',
    { 
      attrs, 
      ...options,
    },
  ];
};

const shopifyCollectionsGet = async (...args) => {
  const response = await shopifyGet(...payloadMaker(...args));
  return response;
};

const shopifyCollectionsGetter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const shopifyCollectionsGetApi = funcApi(shopifyCollectionsGet, {
  argNames: ['credsPath', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
  },
});

module.exports = {
  shopifyCollectionsGet,
  shopifyCollectionsGetter,
  shopifyCollectionsGetApi,
};

// curl localhost:8000/shopifyCollectionsGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'