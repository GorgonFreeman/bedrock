// https://docs.snowflake.com/en/user-guide/oauth-custom

const { respond, mandateParam, credsByPath, logDeep, CustomAxiosClient } = require('../utils');

const snowflakeAuthGet = async (
  {
    credsPath,
    refreshToken,
  } = {},
) => {

  const creds = credsByPath(['snowflake', credsPath]);
  const {
    BASE_URL,
    REFRESH_TOKEN,
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