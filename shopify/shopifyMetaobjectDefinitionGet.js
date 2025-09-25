// https://shopify.dev/docs/api/admin-graphql/latest/queries/metaobjectdefinition

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id name type`;

const shopifyMetaobjectDefinitionGetSingle = async (
  credsPath,
  metaobjectDefinitionId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {
  
  const response = await shopifyGetSingle(
    credsPath,
    'metaobjectDefinition',
    metaobjectDefinitionId,
    {
      apiVersion,
      attrs,
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyMetaobjectDefinitionGet = async (
  credsPath,
  metaobjectDefinitionId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    metaobjectDefinitionId,
    shopifyMetaobjectDefinitionGetSingle,
    (metaobjectDefinitionId) => ({
      args: [credsPath, metaobjectDefinitionId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyMetaobjectDefinitionGetApi = funcApi(shopifyMetaobjectDefinitionGet, {
  argNames: ['credsPath', 'metaobjectDefinitionId', 'options'],
});

module.exports = {
  shopifyMetaobjectDefinitionGet,
  shopifyMetaobjectDefinitionGetApi,
};

// curl localhost:8000/shopifyMetaobjectDefinitionGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "metaobjectDefinitionId": "3472654408" }'
// curl localhost:8000/shopifyMetaobjectDefinitionGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "metaobjectDefinitionId": ["3472654408", "3472752712"] }'