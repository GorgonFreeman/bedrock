// https://shopify.dev/docs/api/admin-graphql/latest/queries/metaobject

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id handle displayName`;

const shopifyMetaobjectGetSingle = async (
  credsPath,
  metaobjectId,
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
  metaobjectId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    metaobjectId,
    shopifyMetaobjectGetSingle,
    (metaobjectId) => ({
      args: [credsPath, metaobjectId],
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
  argNames: ['credsPath', 'metaobjectId', 'options'],
});

module.exports = {
  shopifyMetaobjectGet,
  shopifyMetaobjectGetApi,
};

// curl localhost:8000/shopifyMetaobjectGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "metaobjectId": "177416241224" }'