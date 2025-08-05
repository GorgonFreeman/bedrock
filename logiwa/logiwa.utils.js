const { credsByPath, CustomAxiosClient, Getter, logDeep, askQuestion, getterAsGetFunction } = require('../utils');
const { logiwaAuthGet } = require('../logiwa/logiwaAuthGet');
const { upstashGet, upstashSet } = require('../upstash/upstash.utils');

const AUTH_TOKENS = new Map();

const logiwaRequestSetup = ({ credsPath, apiVersion = 'v3.1' } = {}) => {

  const creds = credsByPath(['logiwa', credsPath]);

  const { 
    BASE_URL,
  } = creds;

  return {
    baseUrl: `${ BASE_URL }/${ apiVersion }`,
  };
};

const logiwaFactory = async({ credsPath, apiVersion } = {}) => {
  const { baseUrl } = logiwaRequestSetup({ credsPath, apiVersion });

  let authToken;

  if (AUTH_TOKENS.has(credsPath)) {
    authToken = AUTH_TOKENS.get(credsPath);
    console.log('Using auth token from map');
  }

  if (!authToken) {
    const upstashAuthTokenResponse = await upstashGet(`logiwa_token_${ credsPath.join('.') }`);
    if (upstashAuthTokenResponse?.success && upstashAuthTokenResponse?.result) {
      authToken = upstashAuthTokenResponse.result;
      AUTH_TOKENS.set(credsPath, authToken);
      console.log('Using auth token from Upstash');
    }
  }

  if (!authToken) {
    const authResponse = await logiwaAuthGet({ credsPath, apiVersion });
    if (!authResponse?.success) {
      throw new Error(authResponse);
    }
    authToken = authResponse?.result;
    AUTH_TOKENS.set(credsPath, authToken);
    upstashSet(`logiwa_token_${ credsPath.join('.') }`, authToken);
    console.log('Using auth token from API');
  }

  const headers = {
    Authorization: `Bearer ${ authToken }`,
  };

  return {
    baseUrl,
    headers,
  };
};

const logiwaClient = new CustomAxiosClient({
  baseUrl: logiwaRequestSetup().baseUrl,
  factory: logiwaFactory,
});

const logiwaGetter = async (
  url,
  {
    credsPath,
    apiVersion,
    params,
    ...getterOptions
  } = {},
) => {
  return new Getter(
    {
      url,
      payload: {
        params,
      },
      paginator: async (customAxiosPayload, response, { url }) => {
        // logDeep(customAxiosPayload, response, url);
        // await askQuestion('paginator?');

        const { success, result } = response;
        if (!success) { // Return if failed
          return [true, null]; 
        }

        // 1. Extract necessary pagination info
        const { totalCount } = result;
        // i and s are both mandatory for the url to resolve, so we can assume they're present
        const page = parseInt(url.match(/\/i\/(\d+)/)?.[1]);
        const perPage = parseInt(url.match(/\/s\/(\d+)/)?.[1]);

        // 2. Supplement payload with next pagination info
        const nextUrl = url.replace(`/i/${ page }`, `/i/${ page + 1 }`);
        
        // 3. Logic to determine done
        const done = page * perPage >= totalCount;
        
        return [done, customAxiosPayload, {
          url: nextUrl,
        }];

      },
      digester: async (response) => {
        // logDeep(response);
        // await askQuestion('digester?');

        const { success, result } = response;
        if (!success) { // Return if failed
          return null; 
        }

        const items = result?.data;
        return items;
      },
      client: logiwaClient,
      clientArgs: {
        context: {
          credsPath,
          apiVersion,
        },
      },

      ...getterOptions
    },
  );
};

const logiwaGet = getterAsGetFunction(logiwaGetter);

module.exports = {
  logiwaClient,
  logiwaGetter,
  logiwaGet,
};