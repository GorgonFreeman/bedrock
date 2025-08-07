const { credsByPath, CustomAxiosClient, Getter, getterAsGetFunction, logDeep, askQuestion } = require('../utils');
const { upstashGet, upstashSet } = require('../upstash/upstash.utils');
const { MAX_PER_PAGE } = require('../etsy/etsy.constants');

const ACCESS_TOKENS = new Map();

const etsyAccessTokenGet = async ({ credsPath } = {}) => {

  // 1. Check if we have a access token in memory
  if (ACCESS_TOKENS.has(credsPath)) {
    console.log('Using access token from map');
    return {
      success: true,
      result: ACCESS_TOKENS.get(credsPath),
    };
  }

  // 2. Check if we have a access token in Upstash
  const upstashAccessTokenResponse = await upstashGet(`etsy_access_token_${ credsPath || 'default' }`);

  if (upstashAccessTokenResponse?.success && upstashAccessTokenResponse?.result) {
    const accessToken = upstashAccessTokenResponse.result;
    ACCESS_TOKENS.set(credsPath, accessToken);
    console.log('Using access token from Upstash');
    return {
      success: true,
      result: accessToken,
    };
  }

  // 3. Give up :)
  return {
    success: false,
    error: [`Can't get an access token from Upstash or memory, maybe try etsyAccessTokenRequest?`],
  };
};

const etsyRequestSetup = async ({ credsPath, withBearer = false } = {}) => {

  const { 
    API_KEY,
    BASE_URL,
  } = credsByPath(['etsy', credsPath]);

  const headers = {
    'x-api-key': API_KEY,
  };

  if (!withBearer) {
    return {
      baseUrl: BASE_URL,
      headers,
    };
  }

  const accessTokenResponse = await etsyAccessTokenGet({ credsPath });

  if (!accessTokenResponse?.success) {
    throw new Error(`Couldn't get access token for ${ credsPath }`);
  }

  const { result: accessToken } = accessTokenResponse;
  headers['Authorization'] = `Bearer ${ accessToken }`;

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

// get base url for use in client
const commonCreds = etsyRequestSetup();
const { baseUrl } = commonCreds;

const etsyClient = new CustomAxiosClient({
  baseUrl,
  factory: etsyRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  baseInterpreter: async (response, context) => {

    console.log('baseInterpreter', response, context);
    await askQuestion('?');

    if (response?.success) {
      return response;
    }

    const { error } = response;

    if (!error) {
      return response;
    }

    let shouldRetry = false;
    let changedCustomAxiosPayload;
    
    // Handle expired access token
    if (error?.find(err => err.error_description === 'access token is expired')) {

      const { credsPath, customAxiosPayload } = context;
      const accessTokenResponse = await etsyAccessTokenGet({ credsPath });

      const {
        success: accessTokenGetSuccess,
        result: accessToken,
      } = accessTokenResponse;

      if (!accessTokenGetSuccess) {
        throw new Error(`Couldn't get access token for ${ credsPath }`);
      }

      shouldRetry = true;
      changedCustomAxiosPayload = {
        ...customAxiosPayload,
        headers: {
          ...customAxiosPayload?.headers,
          Authorization: `Bearer ${ accessToken }`,
        },
      };
    }

    return {
      ...response,
      shouldRetry,
      changedCustomAxiosPayload,
    };
  },
});

const etsyGetter = async (
  url,
  {
    credsPath,
    params,
    perPage = MAX_PER_PAGE,
    ...getterOptions
  } = {},
) => {
  return new Getter(
    {
      url,
      payload: {
        params: {
          ...params,
          limit: perPage,
        },
      },
      paginator: async (customAxiosPayload = {}, response, { resultsCount, lastPageResultsCount }) => {
        // logDeep(customAxiosPayload, response, resultsCount, lastPageResultsCount);
        // await askQuestion('paginator?');

        const { success, result } = response;
        if (!success) { // Return if failed
          return [true, null]; 
        }

        // 1. Extract necessary pagination info
        const { count: totalItems } = result;

        // 2. Supplement payload with next pagination info
        const paginatedPayload = {
          ...customAxiosPayload,
          params: {
            ...customAxiosPayload.params,
            offset: (customAxiosPayload.params?.offset || 0) + lastPageResultsCount,
          },
        };
        
        // 3. Logic to determine done
        const done = resultsCount >= totalItems;
        
        return [done, paginatedPayload];
      },
      digester: async (response) => {
        // logDeep(response);
        // await askQuestion('digester?');

        const { success, result } = response;
        if (!success) { // Return if failed
          return null; 
        }

        const items = result?.results;
        return items;
      },
      client: etsyClient,
      clientArgs: {
        context: {
          credsPath,
        },
      },

      ...getterOptions
    },
  );
};

const etsyGet = getterAsGetFunction(etsyGetter);

module.exports = {
  etsyClient,
  etsyGetter,
  etsyGet,
};