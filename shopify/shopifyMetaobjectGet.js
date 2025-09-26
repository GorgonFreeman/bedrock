// https://shopify.dev/docs/api/admin-graphql/latest/queries/metaobject

const { funcApi, logDeep, actionMultipleOrSingle, objHasAny } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id handle displayName`;

const shopifyMetaobjectGetSingle = async (
  credsPath,
  {
    metaobjectId,
    metaobjectHandle,
  },
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {
  
  const response = await shopifyGetSingle(
    credsPath,
    'metaobject',
    metaobjectId,
    {
      apiVersion,
      attrs,
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyMetaobjectGet = async (
  credsPath,
  metaobjectIdentifier,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    metaobjectIdentifier,
    shopifyMetaobjectGetSingle,
    (metaobjectIdentifier) => ({
      args: [credsPath, metaobjectIdentifier],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyMetaobjectGetApi = funcApi(shopifyMetaobjectGet, {
  argNames: ['credsPath', 'metaobjectIdentifier', 'options'],
  validatorsByArg: {
    metaobjectIdentifier: p => objHasAny(p, ['metaobjectId', 'metaobjectHandle']),
  },
});

module.exports = {
  shopifyMetaobjectGet,
  shopifyMetaobjectGetApi,
};

// curl localhost:8000/shopifyMetaobjectGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "metaobjectIdentifier": { "metaobjectId": "177416241224" } }'
// curl localhost:8000/shopifyMetaobjectGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "metaobjectIdentifier": { "metaobjectHandle": "symbols" } }'