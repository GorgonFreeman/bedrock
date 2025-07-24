const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyThemesGet = async (
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

const shopifyThemesGetApi = async (req, res) => {
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

  const result = await shopifyThemesGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyThemesGet,
  shopifyThemesGetApi,
};

// curl localhost:8000/shopifyThemesGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'