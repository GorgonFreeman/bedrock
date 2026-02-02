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

const shopifyCatalogsGet = async (...args) => {
  const response = await shopifyGet(...payloadMaker(...args));
  return response;
};

const shopifyCatalogsGetter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const shopifyCatalogsGetApi = funcApi(shopifyCatalogsGet, {
  argNames: ['credsPath', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
  },
});

module.exports = {
  shopifyCatalogsGet,
  shopifyCatalogsGetter,
  shopifyCatalogsGetApi,
};

// curl localhost:8000/shopifyCatalogsGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'