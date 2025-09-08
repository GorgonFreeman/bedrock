const { funcApi, logDeep, objHasAny } = require('../utils');
const { shopifyPageGet } = require('../shopify/shopifyPageGet');
const { shopifyPageCreate } = require('../shopify/shopifyPageCreate');

const defaultAttrs = `id`;

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