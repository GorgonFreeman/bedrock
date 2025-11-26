const { funcApi, logDeep } = require('../utils');

const { shopifyBulkOperationRunQuery } = require('../shopify/shopifyBulkOperationRunQuery');
const { shopifyBulkOperationGet } = require('../shopify/shopifyBulkOperationGet');

const shopifyBulkOperationDo = async (
  credsPath,
  type,
  payload,
  {
    apiVersion,
  } = {},
) => {

  const bulkOperationRunner = type === 'query' ? shopifyBulkOperationRunQuery : null;

  if (!bulkOperationRunner) {
    return {
      success: false,
      error: `Type "${ type }" is not supported.`,
    };
  }

  const bulkOperationResponse = await bulkOperationRunner(
    credsPath,
    payload,
    {
      apiVersion,
    },
  );

  const {
    success: runSuccess,
    result: bulkOperation,
  } = bulkOperationResponse;

  if (!runSuccess) {
    return bulkOperationResponse;
  }

  logDeep(bulkOperationResponse);
  return bulkOperationResponse;
};

const shopifyBulkOperationDoApi = funcApi(shopifyBulkOperationDo, {
  argNames: ['credsPath', 'type', 'payload', 'options'],
});

module.exports = {
  shopifyBulkOperationDo,
  shopifyBulkOperationDoApi,
};

// curl localhost:8000/shopifyBulkOperationDo -H "Content-Type: application/json" -d '{ "credsPath": "au", "type": "query", "payload": "{ products { edges { node { id title handle } } } }" }'