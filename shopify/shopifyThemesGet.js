const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyProductsGet = async (
  credsPath,
  options,
) => {

  const response = await shopifyGet(
    credsPath, 
    'product', 
    options,
  );

  return response;
};

const shopifyProductsGetApi = async (req, res) => {
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

  const result = await shopifyProductsGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyProductsGet,
  shopifyProductsGetApi,
};

// curl localhost:8000/shopifyProductsGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'