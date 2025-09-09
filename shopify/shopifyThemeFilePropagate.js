const { funcApi, logDeep, objHasAny } = require('../utils');

const shopifyThemeFilePropagate = async (
  fromRegion,
  toRegions,
  {
    themeName,
    chooseTheme,
  }, // doesn't support themeId
  filePath,
  {
    apiVersion,
  } = {},
) => {

  const themeIdentifier = {
    themeName,
    chooseTheme,
  };

  const fromThemeResponse = await shopifyThemeGet(
    fromRegion, 
    themeIdentifier, 
    {
      apiVersion,
    },
  );
  const { success: fromThemeSuccess, result: fromThemeResult } = fromThemeResponse;
  if (!fromThemeSuccess) {
    return fromThemeResponse;
  }

  logDeep(fromThemeResult);

  const response = true;
  logDeep(response);
  return response;

};

const shopifyThemeFilePropagateApi = funcApi(shopifyThemeFilePropagate, {
  argNames: ['fromRegion', 'toRegions', 'themeIdentifier', 'filePath'],
  validatorsByArg: {
    fromRegion: Boolean,
    toRegions: Array.isArray,
    themeIdentifier: p => objHasAny(p, ['themeName', 'chooseTheme']),
    filePath: Boolean,
  },
});

module.exports = {
  shopifyThemeFilePropagate,
  shopifyThemeFilePropagateApi,
};

// curl localhost:8000/shopifyThemeFilePropagate -H "Content-Type: application/json" -d '{ "fromRegion": "au", "toRegions": ["us", "uk"], "themeIdentifier": { "chooseTheme": true }, "filePath": "templates/page.sign_up_beauty.json" }'