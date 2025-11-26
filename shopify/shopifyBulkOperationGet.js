// https://shopify.dev/docs/api/admin-graphql/latest/queries/order

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id name`;

const shopifyBulkOperationGetSingle = async (
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

const shopifyBulkOperationGet = async (
  credsPath,
  thingId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    thingId,
    shopifyBulkOperationGetSingle,
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

const shopifyBulkOperationGetApi = funcApi(shopifyBulkOperationGet, {
  argNames: ['credsPath', 'thingId', 'options'],
});

module.exports = {
  shopifyBulkOperationGet,
  shopifyBulkOperationGetApi,
};

// curl localhost:8000/shopifyBulkOperationGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "thingId": "7012222266312" }'