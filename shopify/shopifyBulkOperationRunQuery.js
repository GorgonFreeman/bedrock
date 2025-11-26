// https://shopify.dev/docs/api/admin-graphql/latest/mutations/bulkoperationrunquery

const { funcApi, logDeep, customNullish } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id type status objectCount`;

const shopifyBulkOperationRunQuery = async (
  credsPath,
  query,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
    groupObjects,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'bulkOperationRunQuery',
    {
      query: {
        type: 'String!',
        value: query,
      },
      ...!customNullish(groupObjects) && {
        groupObjects: {
          type: 'Boolean!',
          value: groupObjects,
        },
      },
    },
    `bulkOperation { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyBulkOperationRunQueryApi = funcApi(shopifyBulkOperationRunQuery, {
  argNames: ['credsPath', 'query', 'options'],
});

module.exports = {
  shopifyBulkOperationRunQuery,
  shopifyBulkOperationRunQueryApi,
};

// curl http://localhost:8000/shopifyBulkOperationRunQuery -H 'Content-Type: application/json' -d '{ "credsPath": "au", "query": "{ products { edges { node { id title handle } } } }", "options": { "returnAttrs": "id type status objectCount url", "groupObjects": true } }'