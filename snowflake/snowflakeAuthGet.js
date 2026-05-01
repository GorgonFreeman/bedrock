// https://docs.snowflake.com/en/user-guide/oauth-custom

/*
* AUTH_CODE is generated from <base_url>/oauth/authorization, and log in to Snowflake, with redirect_uri 'localhost'
* Use AUTH_CODE to get a new access token & a new refresh token
* Refresh token expires in 90 days
* Access token expires in 24 hours
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

  const creds = credsByPath(['snowflake', credsPath]);
  const {
    BASE_URL,
    AUTH_CODE,
    CLIENT_ID,
    CLIENT_SECRET,
  } = creds;

  if (!refreshToken) {
    return {
      success: false,
      error: ['No refresh token found in creds'],
    };
  }

  const body = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken || REFRESH_TOKEN,
  };

  const client = new CustomAxiosClient({
    baseUrl: BASE_URL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${ Buffer.from(`${ CLIENT_ID }:${ CLIENT_SECRET }`).toString('base64') }`,
    },
  });

  const response = await client.fetch({
    method: 'post',
    url: '/oauth/token-request',
    body,
  });

  logDeep(response);
  return response;
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