// https://shopify.dev/docs/api/admin-graphql/latest/queries/productVariants

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const defaultAttrs = `id title`;

const shopifyVariantsGet = async (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => {

  const response = await shopifyGet(
    credsPath, 
    'productVariant', 
    {
      attrs,
      ...options,
    },
  );

  return response;
};

const shopifyVariantsGetApi = async (req, res) => {
  const { 
    credsPath,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyVariantsGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyVariantsGet,
  shopifyVariantsGetApi,
};

// curl localhost:8000/shopifyVariantsGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'