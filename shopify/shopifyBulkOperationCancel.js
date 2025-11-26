// https://shopify.dev/docs/api/admin-graphql/latest/mutations/bulkoperationcancel

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id status`;

const shopifyBulkOperationCancel = async (
  credsPath,
  bulkOperationId,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'bulkOperationCancel',
    {
      id: {
        type: 'ID!',
        value: `gid://shopify/BulkOperation/${ bulkOperationId }`,
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

const shopifyBulkOperationCancelApi = funcApi(shopifyBulkOperationCancel, {
  argNames: ['credsPath', 'bulkOperationId', 'options'],
});

module.exports = {
  shopifyBulkOperationCancel,
  shopifyBulkOperationCancelApi,
};

// curl http://localhost:8000/shopifyBulkOperationCancel -H 'Content-Type: application/json' -d '{ "credsPath": "au", "bulkOperationId": "" }'