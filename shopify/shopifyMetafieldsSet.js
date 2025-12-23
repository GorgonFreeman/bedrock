// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsset

const { funcApi, logDeep, arrayToChunks, actionMultipleOrSingle } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');
const {
  MAX_PAYLOADS,
} = require('../shopify/shopify.constants');

const defaultAttrs = `id namespace key type value`;

const shopifyMetafieldsSetChunk = async (
  credsPath,
  metafields,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const mutationName = 'metafieldsSet';

  const response = await shopifyMutationDo(
    credsPath,
    mutationName,
    {
      metafields: {
        type: '[MetafieldsSetInput!]!',
        value: metafields,
      },
    },
    `metafields { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyMetafieldsSet = async (
  credsPath,
  metafields,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  const chunks = arrayToChunks(metafields, MAX_PAYLOADS);

  const response = await actionMultipleOrSingle(
    chunks,
    shopifyMetafieldsSetChunk,
    (chunk) => ({
      args: [credsPath, chunk],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyMetafieldsSetApi = funcApi(shopifyMetafieldsSet, {
  argNames: ['credsPath', 'metafields', 'options'],
});

module.exports = {
  shopifyMetafieldsSet,
  shopifyMetafieldsSetApi,
};

// curl http://localhost:8000/shopifyMetafieldsSet -H 'Content-Type: application/json' -d '{ "credsPath": "au", "metafields": [{ "ownerId": "gid://shopify/Product/123456789", "namespace": "custom", "key": "hs_code", "type": "single_line_text_field", "value": "621710" }], "options": { "returnAttrs": "id key namespace value" } }'