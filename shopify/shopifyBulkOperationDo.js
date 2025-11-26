const { funcApi, logDeep, askQuestion, wait, seconds, gidToId, customAxios } = require('../utils');
const { shopifyJsonlInterpret } = require('../shopify/shopify.utils');

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
    result: runResult,
  } = bulkOperationResponse;
  // TODO: Consider supporting a resultsNodePath as an array in shopifyMutationDo > shopifyClient
  const { bulkOperation } = runResult || {};

  if (!runSuccess || !bulkOperation) {
    return bulkOperationResponse;
  }

  const {
    id: bulkOperationGid,
  } = bulkOperation;
  const bulkOperationId = gidToId(bulkOperationGid);

  let runningOpStatus;
  let runningOpResult;

  do {
    await wait(seconds(5));

    const runningBulkOperationResponse = await shopifyBulkOperationGet(
      credsPath,
      bulkOperationId,
      {
        apiVersion,
        attrs: 'id status objectCount url',
      },
    );
  
    const {
      success: runningSuccess,
      result: runningBulkOperation,
    } = runningBulkOperationResponse;
  
    if (!runningSuccess) {
      return runningBulkOperationResponse;
    }

    const {
      status,
    } = runningBulkOperation;

    runningOpStatus = status;
    runningOpResult = runningBulkOperation;

  } while (['CREATED', 'RUNNING'].includes(runningOpStatus));

  if (runningOpStatus === 'COMPLETED') {
    // TODO: Get and return data from bulk operation
    logDeep('runningOpResult', runningOpResult);

    const {
      url, 
      objectCount,
    } = runningOpResult;

    const resultsResponse = await customAxios(url);
    const { success: resultsSuccess, result: bulkOperationResultsJsonl } = resultsResponse;
    if (!resultsSuccess) {
      return resultsResponse;
    }
    const bulkOperationResults = shopifyJsonlInterpret(bulkOperationResultsJsonl);

    return {
      success: true,
      result: bulkOperationResults,
    };
  }

  return {
    success: false,
    error: [`Bulk operation failed with status: ${ runningOpStatus }`],
  };
};

const shopifyBulkOperationDoApi = funcApi(shopifyBulkOperationDo, {
  argNames: ['credsPath', 'type', 'payload', 'options'],
});

module.exports = {
  shopifyBulkOperationDo,
  shopifyBulkOperationDoApi,
};

// curl localhost:8000/shopifyBulkOperationDo -H "Content-Type: application/json" -d '{ "credsPath": "au", "type": "query", "payload": "{ products { edges { node { id title handle } } } }" }'