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

const FUNC = async (...args) => {
  const response = await shopifyGet(...payloadMaker(...args));
  return response;
};

const FUNCter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const FUNCApi = funcApi(FUNC, {
  argNames: ['credsPath', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
  },
});

module.exports = {
  FUNC,
  FUNCter,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'