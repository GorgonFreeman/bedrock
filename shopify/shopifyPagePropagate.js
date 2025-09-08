const { funcApi, logDeep, objHasAny, arrayStandardResponse, actionMultipleOrSingle } = require('../utils');
const { shopifyPageGet } = require('../shopify/shopifyPageGet');
const { shopifyPageCreate } = require('../shopify/shopifyPageCreate');

const attrs = `
  body
  handle
  isPublished
  templateSuffix
  title
`;

const shopifyPagePropagateSingle = async (
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

  const { success: pageGetSuccess, result: pageGetResult } = shopifyPageResponse;
  if (!pageGetSuccess) {
    return shopifyPageResponse;
  }

  const pageCreatePayload = {
    ...pageGetResult,
  };

  const pageCreateResponses = [];
  for (const toCredsPath of toCredsPaths) {
    const pageCreateResponse = await shopifyPageCreate(
      toCredsPath,
      pageCreatePayload,
      {
        apiVersion,
        returnAttrs: attrs,
      },
    );
    pageCreateResponses.push(pageCreateResponse);
  }

  const response = arrayStandardResponse(pageCreateResponses);
  logDeep(response);
  return response;
};

const shopifyPagePropagate = async (
  fromCredsPath,
  toCredsPaths,
  pageIdentifier,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    pageIdentifier,
    shopifyPagePropagateSingle,
    (pageIdentifier) => ({
      args: [fromCredsPath, toCredsPaths, pageIdentifier],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
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
// curl localhost:8000/shopifyPagePropagate -H "Content-Type: application/json" -d '{ "fromCredsPath": "au", "toCredsPaths": ["us"], "pageIdentifier": [{ "pageId": "89503039560" }, { "pageId": "89531646024" }] }'
