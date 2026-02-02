// https://shopify.dev/docs/api/admin-graphql/latest/queries/publications

const { funcApi, logDeep } = require('../utils');
const { shopifyGet, shopifyGetter } = require('../shopify/shopify.utils');

const defaultAttrs = `
  id 
  catalog { 
    title 
  }
`;

const payloadMaker = (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => {
  return [
    credsPath, 
    'publication',
    { 
      attrs, 
      ...options,
    },
  ];
};

const shopifyPublicationsGet = async (...args) => {
  const response = await shopifyGet(...payloadMaker(...args));
  logDeep(response);
  return response;
};

const shopifyPublicationsGetter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const shopifyPublicationsGetApi = funcApi(shopifyPublicationsGet, {
  argNames: ['credsPath', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
  },
});

module.exports = {
  shopifyPublicationsGet,
  shopifyPublicationsGetter,
  shopifyPublicationsGetApi,
};

// curl localhost:8000/shopifyPublicationsGet -H "Content-Type: application/json" -d '{ "credsPath": "au" }'