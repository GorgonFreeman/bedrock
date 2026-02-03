// https://shopify.dev/docs/api/admin-graphql/latest/queries/publication

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id name`;

const shopifyPublicationGetSingle = async (
  credsPath,
  publicationId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {
  
  const response = await shopifyGetSingle(
    credsPath,
    'publication',
    publicationId,
    {
      apiVersion,
      attrs,
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyPublicationGet = async (
  credsPath,
  publicationId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    publicationId,
    shopifyPublicationGetSingle,
    (publicationId) => ({
      args: [credsPath, publicationId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyPublicationGetApi = funcApi(shopifyPublicationGet, {
  argNames: ['credsPath', 'publicationId', 'options'],
});

module.exports = {
  shopifyPublicationGet,
  shopifyPublicationGetApi,
};

// curl localhost:8000/shopifyPublicationGet -H "Content-Type: application/json" -d '{ "credsPath": "uk", "publicationId": "1234567890", "options": { "attrs": "id name catalog { id title }" } }'