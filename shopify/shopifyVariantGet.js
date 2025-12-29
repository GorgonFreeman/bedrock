// https://shopify.dev/docs/api/admin-graphql/latest/queries/productvariant

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const { shopifyVariantsGet } = require('../shopify/shopifyVariantsGet');

const defaultAttrs = `id title`;

const shopifyVariantGetSingle = async (
  credsPath,
  {
    variantId,
    sku,
  },
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  if (variantId) {
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
  }

  // Searching by sku
  attrs += ' sku';
  
  const variantsResponse = await shopifyVariantsGet(
    credsPath, 
    {
      apiVersion,
      attrs,
      queries: [`sku:${ sku }`],
    },
  );

  const { success: variantsSuccess, result: variants } = variantsResponse;
  if (!variantsSuccess) {
    return variantsResponse;
  }

  const variant = variants.find((v) => v.sku === sku);
  if (!variant) {
    return {
      success: false,
      error: [`Variant with sku '${sku}' not found`],
    };
  }
  
  const response = {
    success: true,
    result: variant,
  };
  logDeep(response);
  return response;
};

const shopifyVariantGet = async (
  credsPath,
  variantIdentifier,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    variantIdentifier,
    shopifyVariantGetSingle,
    (variantIdentifier) => ({
      args: [credsPath, variantIdentifier],
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
  argNames: ['credsPath', 'variantIdentifier', 'options'],
});

module.exports = {
  shopifyVariantGet,
  shopifyVariantGetApi,
};

// curl localhost:8000/shopifyVariantGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "variantIdentifier": { "sku": "________" } }'