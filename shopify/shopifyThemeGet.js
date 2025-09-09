// https://shopify.dev/docs/api/admin-graphql/latest/queries/theme

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id name role`;

const shopifyThemeGet = async (
  credsPath,
  {
    themeId,
  },
  {
    attrs = defaultAttrs,
    apiVersion,
  } = {},
) => {

  const response = await shopifyGetSingle(
    credsPath,
    'theme',
    themeId,
    {
      apiVersion,
      attrs,
    },
  );

  logDeep(response);
  return response;
};

const shopifyThemeGetApi = async (req, res) => {
  const { 
    credsPath,
    themeIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'themeIdentifier', themeIdentifier),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyThemeGet(
    credsPath,
    themeIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyThemeGet,
  shopifyThemeGetApi,
};

// curl localhost:8000/shopifyThemeGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "themeIdentifier": { "themeId": "6979774283848" } }'