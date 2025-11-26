const { funcApi, logDeep, askQuestion } = require('../utils');

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

  const {
    id: bulkOperationId,
  } = bulkOperation;

  const runningBulkOperationResponse = await shopifyBulkOperationGet(
    credsPath,
    bulkOperationId,
    {
      apiVersion: 'unstable', // TODO: Change this when the API is stable
    },
  );

  const {
    success: runningSuccess,
    result: runningBulkOperation,
  } = runningBulkOperationResponse;

  if (!runningSuccess) {
    return runningBulkOperationResponse;
  }

  logDeep(runningBulkOperation);
  await askQuestion('?');

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