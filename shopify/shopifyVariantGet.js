// https://shopify.dev/docs/api/admin-graphql/latest/queries/productvariant

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id title`;

const shopifyVariantGetSingle = async (
  credsPath,
  variantId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {
  
  const response = await shopifyGetSingle(
    credsPath,
    'productVariant',
    variantId,
    {
      apiVersion,
      attrs,
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyVariantGet = async (
  credsPath,
  variantId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    variantId,
    shopifyVariantGetSingle,
    (variantId) => ({
      args: [credsPath, variantId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyVariantGetApi = funcApi(shopifyVariantGet, {
  argNames: ['credsPath', 'variantId', 'options'],
});

module.exports = {
  shopifyVariantGet,
  shopifyVariantGetApi,
};

// curl localhost:8000/shopifyVariantGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "variantId": "________" }'