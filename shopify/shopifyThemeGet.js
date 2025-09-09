// https://shopify.dev/docs/api/admin-graphql/latest/queries/theme

const { logDeep, funcApi, objHasAny, standardInterpreters } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyThemesGet } = require('../shopify/shopifyThemesGet');

const defaultAttrs = `id name role`;

const shopifyThemeGet = async (
  credsPath,
  {
    themeId,
    themeName,
  },
  {
    attrs = defaultAttrs,
    apiVersion,
  } = {},
) => {

  if (themeId) {
    const response = await shopifyGetSingle(
      credsPath,
      'theme',
      themeId,
      {
        gidType: 'OnlineStoreTheme',
        apiVersion,
        attrs,
      },
    );
  
    logDeep(response);
    return response;
  }

  if (themeName) {
    const themesResponse = await shopifyThemesGet(credsPath, {
      apiVersion,
      attrs,
      names: [themeName],
    });
    const response = standardInterpreters.expectOne(themesResponse);
    logDeep(response);
    return response;
  }

  return {
    success: false,
    error: ['No theme identifier provided'],
  }
};

const shopifyThemeGetApi = funcApi(shopifyThemeGet, {
  argNames: ['credsPath', 'themeIdentifier', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    themeIdentifier: p => objHasAny(p, ['themeId', 'themeName']),
  },
});

module.exports = {
  shopifyThemeGet,
  shopifyThemeGetApi,
};

// curl localhost:8000/shopifyThemeGet -H "Content-Type: application/json" -d '{ "credsPath": "us", "themeIdentifier": { "themeId": "142724202556" } }'
// curl localhost:8000/shopifyThemeGet -H "Content-Type: application/json" -d '{ "credsPath": "us", "themeIdentifier": { "themeName": "Post Sale- Wk 36" } }'