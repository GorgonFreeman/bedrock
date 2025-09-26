// https://shopify.dev/docs/api/admin-graphql/latest/queries/order

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id name`;

const shopifyMetaobjectGetSingle = async (
  credsPath,
  thingId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {
  
  const response = await shopifyGetSingle(
    credsPath,
    'thing',
    thingId,
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
  thingId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    thingId,
    shopifyMetaobjectGetSingle,
    (thingId) => ({
      args: [credsPath, thingId],
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
  argNames: ['credsPath', 'thingId', 'options'],
});

module.exports = {
  shopifyMetaobjectGet,
  shopifyMetaobjectGetApi,
};

// curl localhost:8000/shopifyMetaobjectGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "thingId": "7012222266312" }'