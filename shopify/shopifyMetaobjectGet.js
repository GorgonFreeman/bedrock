// https://shopify.dev/docs/api/admin-graphql/latest/queries/metaobject

const { funcApi, logDeep, actionMultipleOrSingle, objHasAny, objHasAll } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id handle displayName`;

const shopifyMetaobjectGetSingle = async (
  credsPath,
  {
    metaobjectId,

    metaobjectHandle,
    metaobjectType,
  },
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  if (metaobjectId) {
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
  }

  /* metaobjectHandle */
  const query = `
    query metaobjectByHandle($handle: MetaobjectHandleInput!) {
      metaobjectByHandle(handle: $handle) {
        ${ attrs }
      } 
    }
  `;

  const variables = {
    handle: {
      handle: metaobjectHandle,
      type: metaobjectType,
    },
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query, variables },
    context: {
      credsPath,
      apiVersion,
      resultsNode: 'metaobjectByHandle',
    },
  });
  logDeep(response);
  return response;
  /* /metaobjectHandle */
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
    metaobjectIdentifier: p => objHasAny(p, ['metaobjectId']) || objHasAll(p, ['metaobjectHandle', 'metaobjectType']),
  },
});

module.exports = {
  shopifyMetaobjectGet,
  shopifyMetaobjectGetApi,
};

// curl localhost:8000/shopifyMetaobjectGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "metaobjectIdentifier": { "metaobjectId": "177416241224" } }'
// curl localhost:8000/shopifyMetaobjectGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "metaobjectIdentifier": { "metaobjectHandle": "symbols", "metaobjectType": "emoji_categories" } }'
// curl localhost:8000/shopifyMetaobjectGet -H "Content-Type: application/json" -d '{ "credsPath": "uk", "metaobjectIdentifier": { "metaobjectHandle": "symbols", "metaobjectType": "emoji_categories" }, "options": { "attrs": "id handle displayName type fields { key value type reference { ... on MediaImage { id } ... on GenericFile { id } ... on Metaobject { id handle type } } }" } }'