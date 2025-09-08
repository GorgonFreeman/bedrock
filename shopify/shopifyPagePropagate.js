const { funcApi, logDeep, objHasAny } = require('../utils');
const { shopifyPageGet } = require('../shopify/shopifyPageGet');
const { shopifyPageCreate } = require('../shopify/shopifyPageCreate');

const attrs = `
  body
  handle
  isPublished
  templateSuffix
  title
`;

const shopifyPagePropagate = async (
  fromCredsPath,
  toCredsPaths,
  {
    pageId,
    pageHandle,
  },
  {
    apiVersion,
  } = {},
) => {

  const shopifyPageResponse = await shopifyPageGet(
    fromCredsPath,
    pageId,
    {
      apiVersion,
      attrs,
    },
  );

  logDeep('shopifyPageResponse', shopifyPageResponse);

  const { success: pageGetSuccess, result: pageGetResult } = shopifyPageResponse;
  if (!pageGetSuccess) {
    return shopifyPageResponse;
  }
  
  logDeep('pageGetResult', pageGetResult);

  const response = true;
  logDeep(response);
  return response;
};

const shopifyPagePropagateApi = funcApi(shopifyPagePropagate, {
  argNames: ['fromCredsPath', 'toCredsPaths', 'pageIdentifier'],
  validatorsByArg: {
    fromCredsPath: Boolean,
    toCredsPaths: Boolean,
    pageIdentifier: p => objHasAny(p, ['pageId', 'pageHandle']),
  },
});

module.exports = {
  shopifyPagePropagate,
  shopifyPagePropagateApi,
};

// curl localhost:8000/shopifyPagePropagate -H "Content-Type: application/json" -d '{ "fromCredsPath": "au", "toCredsPaths": ["us"], "pageIdentifier": { "pageId": "89503039560" } }'