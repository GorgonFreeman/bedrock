// https://shopify.dev/docs/api/admin-graphql/latest/queries/product

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id title handle`;

const shopifyProductGet = async (
  credsPath,
  {
    productId,
    customId,
    handle,
  },
  {
    attrs = defaultAttrs,
    apiVersion,
  } = {},
) => {

  const response = await shopifyGetSingle(    credsPath,
    'product',
    productId,
    {
      apiVersion,
      attrs,
    },
  );

  logDeep(response);
  return response;
};

const shopifyProductGetApi = async (req, res) => {
  const { 
    credsPath,
    productIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'productIdentifier', productIdentifier, p => objHasAny(p, ['productId', 'customId', 'handle'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyProductGet(
    credsPath,
    productIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyProductGet,
  shopifyProductGetApi,
};

// curl localhost:8000/shopifyProductGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "productIdentifier": { "productId": "6979774283848" } }'
// curl localhost:8000/shopifyProductGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "productIdentifier": { "handle": "forever-is-ours-baby-tee-cupcake" } }'