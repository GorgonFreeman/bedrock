const { credsByPath, CustomAxiosClient } = require('../utils');
const { upstashGet, upstashSet } = require('../upstash/upstash.utils');

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

const etsyRequestSetup = async ({ credsPath, withBearer = true } = {}) => {

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
});

module.exports = {
  etsyClient,
};