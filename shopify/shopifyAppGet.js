// https://shopify.dev/docs/api/admin-graphql/latest/queries/order

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id name`;

const shopifyAppGetSingle = async (
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

const shopifyAppGet = async (
  credsPath,
  thingId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    thingId,
    shopifyAppGetSingle,
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

const shopifyAppGetApi = funcApi(shopifyAppGet, {
  argNames: ['credsPath', 'thingId', 'options'],
});

module.exports = {
  shopifyAppGet,
  shopifyAppGetApi,
};

// curl localhost:8000/shopifyAppGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "thingId": "7012222266312" }'