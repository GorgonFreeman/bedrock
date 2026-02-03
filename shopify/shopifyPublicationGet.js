// https://shopify.dev/docs/api/admin-graphql/latest/queries/order

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id name`;

const shopifyPublicationGetSingle = async (
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

const shopifyPublicationGet = async (
  credsPath,
  thingId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    thingId,
    shopifyPublicationGetSingle,
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

const shopifyPublicationGetApi = funcApi(shopifyPublicationGet, {
  argNames: ['credsPath', 'thingId', 'options'],
});

module.exports = {
  shopifyPublicationGet,
  shopifyPublicationGetApi,
};

// curl localhost:8000/shopifyPublicationGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "thingId": "7012222266312" }'