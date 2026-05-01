// https://docs.snowflake.com/en/user-guide/oauth-custom

/*
* AUTH_CODE is generated from <base_url>/oauth/authorization, and log in to Snowflake, with redirect_uri 'localhost'
* Use AUTH_CODE to get a new access token & a new refresh token
* Refresh token expires in 90 days (this is set in Snowflake Rest Integration)
* Access token expires in 10 mins
* Use grant_type 'authorization_code' to use the auth get a new access token & a new refresh token
* Use grant_type 'refresh_token' to use the refresh token and get a new access token
*/

const { respond, mandateParam, credsByPath, logDeep, CustomAxiosClient, askQuestion } = require('../utils');

const { upstashGet, upstashSet } = require('../upstash/upstash.utils');

const snowflakeAuthGet = async (
  {
    credsPath,
  } = {},
) => {

  let accessToken;
  let refreshToken;

  const accessTokenUpstashKey = `snowflake_access_token_${ credsPath?.join('.') || 'default' }`;
  const refreshTokenUpstashKey = `snowflake_refresh_token_${ credsPath?.join('.') || 'default' }`;

  // Snowflake creds
  const creds = credsByPath(['snowflake', credsPath]);
  const {
    BASE_URL,
    AUTH_CODE,
    CLIENT_ID,
    CLIENT_SECRET,
  } = creds;

  // Fetch access token from upstash first
  const accessTokenResponse = await upstashGet(accessTokenUpstashKey);
  if (!accessTokenResponse.success) {
    return {
      success: false,
      error: accessTokenResponse.error,
    }
  }
  accessToken = accessTokenResponse.result;
  // TODO: figure out how to get the access token expiry from the response

  // Respond with access token if access token is found in upstash
  if (accessToken) {
    return {
      success: true,
      result: {
        accessToken,
      },
    };
  }

  const authClient = new CustomAxiosClient({
    baseUrl: BASE_URL,
    baseHeaders: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${ Buffer.from(`${ CLIENT_ID }:${ CLIENT_SECRET }`).toString('base64') }`,
    },
  });

  // If access token is not found in upstash, generate a new access token from the refresh token
  // Fetch refresh token from upstash first
  const refreshTokenResponse = await upstashGet(refreshTokenUpstashKey);
  if (!refreshTokenResponse?.success) {
    throw new Error(refreshTokenResponse);
  }
  refreshToken = refreshTokenResponse?.result;

  // If refresh token is not found in upstash, generate a new access token and refresh token from the auth code
  if (!refreshToken) {
    const body = {
      grant_type: 'authorization_code',
      code: AUTH_CODE,
      redirect_uri: 'https://localhost.com',
    }

    const refreshTokenResponse = await authClient.fetch({
      method: 'post',
      url: '/oauth/token-request',
      body,
    });

    // If refresh token response is not successful, return error
    if (!refreshTokenResponse.success) {
      // TODO: Figure out how to handle refresh token expiry automatically
      return {
        success: false,
        error: [
          'The refresh token may have expired',
          refreshTokenResponse.error,
        ],
      }
    }

    // If refresh token response is successful, set the access token and refresh token in upstash
    const {
      access_token: accessToken,
      expires_in: accessTokenExpiresIn,
      refresh_token: refreshToken,
      refresh_token_expires_in: refreshTokenExpiresIn,
    } = refreshTokenResponse.result;
    await upstashSet(refreshTokenUpstashKey, refreshToken, { ex: refreshTokenExpiresIn });
    await upstashSet(accessTokenUpstashKey, accessToken, { ex: accessTokenExpiresIn });
    logDeep('Saved new access token and refresh token in upstash');

    // Respond with access token
    return {
      success: true,
      result: {
        accessToken,
      },
    };
  }

  // If refresh token is found, use refresh token to generate a new access token
  if (refreshToken) {
    const body = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };

    const accessTokenRefreshResponse = await authClient.fetch({
      method: 'post',
      url: '/oauth/token-request',
      body,
    });

    if (!accessTokenRefreshResponse.success) {
      return {
        success: false,
        error: accessTokenRefreshResponse.error,
      }
    }
    
    const {
      access_token: accessToken,
      expires_in: accessTokenExpiresIn,
    } = accessTokenRefreshResponse.result;
    await upstashSet(accessTokenUpstashKey, accessToken, { ex: accessTokenExpiresIn });
    logDeep('Saved new access token in upstash');

    // Respond with access token
    return {
      success: true,
      result: {
        accessToken,
      },
    };
  }

  return {
    success: false,
    error: ['Error generating access token'],
  }

};

const snowflakeAuthGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  const result = await snowflakeAuthGet(options);
  respond(res, 200, result);
};

module.exports = {
  snowflakeAuthGet,
  snowflakeAuthGetApi,
};

// curl localhost:8000/snowflakeAuthGet
// curl localhost:8000/snowflakeAuthGet -H "Content-Type: application/json" -d '{ "options": { "credsPath": "default" } }'