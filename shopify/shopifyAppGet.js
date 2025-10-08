// https://shopify.dev/docs/api/admin-graphql/latest/queries/app

const { funcApi, logDeep, actionMultipleOrSingle, objHasAny, objHasAll } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id apiKey developerName handle title`;

const shopifyAppGetSingle = async (
  credsPath,
  {
    appId,
    appHandle,
  },
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  if (appId) {
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
  }

  /* appHandle */
  const query = `
    query appByHandle($handle: String!) {
      appByHandle(handle: $handle) {
        ${ attrs }
      } 
    }
  `;

  const variables = {
    handle: appHandle,
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query, variables },
    context: {
      credsPath,
      apiVersion,
      resultsNode: 'appByHandle',
    },
  });
  logDeep(response);
  return response;
  /* /appHandle */
};

const shopifyAppGet = async (
  credsPath,
  appIdentifier,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    appIdentifier,
    shopifyAppGetSingle,
    (appIdentifier) => ({
      args: [credsPath, appIdentifier],
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
  argNames: ['credsPath', 'appIdentifier', 'options'],
  validatorsByArg: {
    appIdentifier: p => objHasAny(p, ['appId', 'appHandle']),
  },
});

module.exports = {
  shopifyAppGet,
  shopifyAppGetApi,
};

// curl localhost:8000/shopifyAppGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "appIdentifier": { "appId": "138898178049" } }'
// curl localhost:8000/shopifyAppGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "appIdentifier": { "appHandle": "tender" } }'