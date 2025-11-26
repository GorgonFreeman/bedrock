// https://shopify.dev/docs/api/admin-graphql/latest/queries/bulkoperation

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id status objectCount url`;

const shopifyBulkOperationGetSingle = async (
  credsPath,
  bulkOperationId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {
  
  const response = await shopifyGetSingle(
    credsPath,
    'bulkOperation',
    bulkOperationId,
    {
      apiVersion,
      attrs,
    },
  );

  return response;
};

const shopifyBulkOperationGet = async (
  credsPath,
  bulkOperationId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    bulkOperationId,
    shopifyBulkOperationGetSingle,
    (bulkOperationId) => ({
      args: [credsPath, bulkOperationId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  return response;
};

const shopifyBulkOperationGetApi = funcApi(shopifyBulkOperationGet, {
  argNames: ['credsPath', 'bulkOperationId', 'options'],
});

module.exports = {
  shopifyBulkOperationGet,
  shopifyBulkOperationGetApi,
};

// curl localhost:8000/shopifyBulkOperationGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "bulkOperationId": "3525975375944" }'