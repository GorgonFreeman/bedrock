// https://shopify.dev/docs/api/admin-graphql/latest/queries/theme

const { HOSTED } = require('../constants');
const { logDeep, funcApi, objHasAny, standardInterpreters } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyThemesGet } = require('../shopify/shopifyThemesGet');
const { interactiveChooseOption } = require('../utils');

const defaultAttrs = `id name role`;

const shopifyThemeGet = async (
  credsPath,
  {
    themeId,
    themeName,
    chooseTheme,
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

  if (chooseTheme) {
    if (HOSTED) {
      return {
        success: false,
        error: ['Choose theme can only be done locally'],
      }
    }

    const themesResponse = await shopifyThemesGet(credsPath, {
      apiVersion,
      attrs,
    });

    const { success: themesSuccess, result: themesResult } = themesResponse;
    if (!themesSuccess) {
      return themesResponse;
    }

    const chosenTheme = await interactiveChooseOption(
      'Choose a theme',
      themesResult,
      {
        nameNode: 'name',
      },
    );
    logDeep(chosenTheme);

    return {
      success: true,
      result: chosenTheme,
    };
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
    themeIdentifier: p => objHasAny(p, ['themeId', 'themeName', 'chooseTheme']),
  },
});

module.exports = {
  shopifyThemeGet,
  shopifyThemeGetApi,
};

// curl localhost:8000/shopifyThemeGet -H "Content-Type: application/json" -d '{ "credsPath": "us", "themeIdentifier": { "themeId": "142724202556" } }'
// curl localhost:8000/shopifyThemeGet -H "Content-Type: application/json" -d '{ "credsPath": "us", "themeIdentifier": { "themeName": "Post Sale- Wk 36" } }'
// curl localhost:8000/shopifyThemeGet -H "Content-Type: application/json" -d '{ "credsPath": "us", "themeIdentifier": { "chooseTheme": true } }'