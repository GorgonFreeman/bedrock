// https://shopify.dev/docs/api/admin-graphql/latest/queries/theme

const { logDeep, funcApi } = require('../utils');
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

const shopifyThemeGetApi = funcApi(shopifyThemeGet, {
  argNames: ['credsPath', 'themeIdentifier', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    themeIdentifier: Boolean,
  },
});

module.exports = {
  shopifyThemeGet,
  shopifyThemeGetApi,
};

// curl localhost:8000/shopifyThemeGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "themeIdentifier": { "themeId": "6979774283848" } }'