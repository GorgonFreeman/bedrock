const { funcApi, logDeep } = require('../utils');

const shopifyThemeFilePropagate = async (
  fromRegion,
  toRegions,
  themeIdentifier,
  filePath,
  {
    apiVersion,
  } = {},
) => {

  const response = true;
  logDeep(response);
  return response;

};

const shopifyThemeFilePropagateApi = funcApi(shopifyThemeFilePropagate, {
  argNames: ['fromRegion', 'toRegions', 'themeIdentifier', 'filePath'],
  validatorsByArg: {
    fromRegion: Boolean,
    toRegions: Array.isArray,
    themeIdentifier: Boolean,
    filePath: Boolean,
  },
});

module.exports = {
  shopifyThemeFilePropagate,
  shopifyThemeFilePropagateApi,
};

// curl localhost:8000/shopifyThemeFilePropagate -H "Content-Type: application/json" -d '{ "fromRegion": "au", "toRegions": ["us", "uk"], "themeIdentifier": { "chooseTheme": true }, "filePath": "templates/page.sign_up_beauty.json" }'