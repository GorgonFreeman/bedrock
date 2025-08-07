const { credsByPath, CustomAxiosClient, Getter, getterAsGetFunction, logDeep, askQuestion } = require('../utils');
const { upstashGet, upstashSet } = require('../upstash/upstash.utils');
const { MAX_PER_PAGE } = require('../etsy/etsy.constants');
const { etsyAccessTokenRefresh } = require('../etsy/etsyAccessTokenRefresh');

const ACCESS_TOKENS = new Map();
const REFRESH_TOKENS = new Map();

const etsyRefreshTokenGet = async ({ credsPath }) => {
  // 1. Check if we have a refresh token in memory
  if (REFRESH_TOKENS.has(credsPath)) {
    console.log('Using refresh token from map');
    return {
      success: true,
      result: REFRESH_TOKENS.get(credsPath),
    };
  }

  // 2. Check if we have a refresh token in Upstash
  const upstashRefreshTokenResponse = await upstashGet(`etsy_refresh_token_${ credsPath || 'default' }`);

  if (upstashRefreshTokenResponse?.success && upstashRefreshTokenResponse?.result) {
    const refreshToken = upstashRefreshTokenResponse.result;
    REFRESH_TOKENS.set(credsPath, refreshToken);
    console.log('Using refresh token from Upstash');
    return {
      success: true,
      result: refreshToken,
    };
  }

  // 3. Give up :)
  return {
    success: false,
    error: [`Can't get a refresh token from Upstash or memory, try etsyAuthCodeRequest?`],
  };
};

const etsyAccessTokenGet = async ({ credsPath, forceRefresh } = {}) => {

  if (!forceRefresh) {
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
  }

  // 3. Try to get a new access token from the API
  const refreshTokenResponse = await etsyRefreshTokenGet({ credsPath });

  if (refreshTokenResponse?.success) {
    const refreshToken = refreshTokenResponse.result;
    const accessTokenRefreshResponse = await etsyAccessTokenRefresh({ credsPath });

    if (accessTokenRefreshResponse?.success) {
      const {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      } = accessTokenRefreshResponse.result;

      ACCESS_TOKENS.set(credsPath, accessToken);
      REFRESH_TOKENS.set(credsPath, newRefreshToken);
      await upstashSet(`etsy_access_token_${ credsPath || 'default' }`, accessToken);
      await upstashSet(`etsy_refresh_token_${ credsPath || 'default' }`, newRefreshToken);

      return {
        success: true,
        result: accessToken,
      };
    }
  }

  // 4. Give up :)
  return {
    success: false,
    error: [`Can't get an access token.`],
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

    logDeep('baseInterpreter', response, context);
    await askQuestion('?');

    if (response?.success) {
      return response;
    }

    const { error } = response;

    if (!error?.length) {
      return response;
    }

    let shouldRetry = false;
    let changedCustomAxiosPayload;
    
    // Handle expired access token
    if (error?.some(err => err?.data?.error_description === 'access token is expired')) {

      const { credsPath, customAxiosPayload } = context;
      const accessTokenResponse = await etsyAccessTokenGet({ credsPath, forceRefresh: true });

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