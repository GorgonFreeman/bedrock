// https://shopify.dev/docs/api/admin-graphql/latest/queries/discountRedeemCodeBulkCreation

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id codesCount importedCount failedCount done`;

const shopifyDiscountRedeemCodeBulkCreationGetSingle = async (
  credsPath,
  discountRedeemCodeBulkCreationId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {
  
  const response = await shopifyGetSingle(
    credsPath,
    'discountRedeemCodeBulkCreation',
    discountRedeemCodeBulkCreationId,
    {
      apiVersion,
      attrs,
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyDiscountRedeemCodeBulkCreationGet = async (
  credsPath,
  discountRedeemCodeBulkCreationId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    discountRedeemCodeBulkCreationId,
    shopifyDiscountRedeemCodeBulkCreationGetSingle,
    (discountRedeemCodeBulkCreationId) => ({
      args: [credsPath, discountRedeemCodeBulkCreationId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyDiscountRedeemCodeBulkCreationGetApi = funcApi(shopifyDiscountRedeemCodeBulkCreationGet, {
  argNames: ['credsPath', 'discountRedeemCodeBulkCreationId', 'options'],
});

module.exports = {
  shopifyDiscountRedeemCodeBulkCreationGet,
  shopifyDiscountRedeemCodeBulkCreationGetApi,
};

// curl localhost:8000/shopifyDiscountRedeemCodeBulkCreationGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "discountRedeemCodeBulkCreationId": "582383534152" }'