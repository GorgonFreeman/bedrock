// https://shopify.dev/docs/api/admin-graphql/latest/queries/app

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id apiKey developerName`;

const shopifyAppGetSingle = async (
  credsPath,
  appId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {
  
  const response = await shopifyGetSingle(
    credsPath,
    'app',
    appId,
    {
      apiVersion,
      attrs,
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyAppGet = async (
  credsPath,
  appId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    appId,
    shopifyAppGetSingle,
    (appId) => ({
      args: [credsPath, appId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyAppGetApi = funcApi(shopifyAppGet, {
  argNames: ['credsPath', 'appId', 'options'],
});

module.exports = {
  shopifyAppGet,
  shopifyAppGetApi,
};

// curl localhost:8000/shopifyAppGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "appId": "218165444609" }'