// https://shopify.dev/docs/api/admin-graphql/latest/queries/order

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id name`;

const shopifyDiscountRedeemCodeBulkCreationGetSingle = async (
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

const shopifyDiscountRedeemCodeBulkCreationGet = async (
  credsPath,
  thingId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    thingId,
    shopifyDiscountRedeemCodeBulkCreationGetSingle,
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

const shopifyDiscountRedeemCodeBulkCreationGetApi = funcApi(shopifyDiscountRedeemCodeBulkCreationGet, {
  argNames: ['credsPath', 'thingId', 'options'],
});

module.exports = {
  shopifyDiscountRedeemCodeBulkCreationGet,
  shopifyDiscountRedeemCodeBulkCreationGetApi,
};

// curl localhost:8000/shopifyDiscountRedeemCodeBulkCreationGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "thingId": "7012222266312" }'