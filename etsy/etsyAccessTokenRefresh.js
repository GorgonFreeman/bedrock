// https://developers.etsy.com/documentation/essentials/authentication#requesting-an-oauth-token

const { respond, mandateParam, logDeep, credsByPath, CustomAxiosClient } = require('../utils');
const { upstashGet, upstashSet } = require('../upstash/upstash.utils');

const etsyAccessTokenRefresh = async (
  {
    credsPath,
    refreshToken,
  } = {},
) => {

  const creds = credsByPath(['etsy', credsPath]);
  const { 
    API_KEY,
    BASE_URL,
  } = creds;
  
  const refreshTokenKey = `etsy_refresh_token_${ credsPath || 'default' }`;
  
  if (!refreshToken) {
    const refreshTokenGetResponse = await upstashGet(refreshTokenKey);

    if (!refreshTokenGetResponse?.success) {
      return refreshTokenGetResponse;
    }

    refreshToken = refreshTokenGetResponse?.result;
  }

  if (!refreshToken) {
    return { 
      success: false,
      error: ['No refresh token found'],
    };
  }

  const body = {
    grant_type: 'refresh_token',
    client_id: API_KEY,
    refresh_token: refreshToken,
  };

  const client = new CustomAxiosClient({
    baseUrl: BASE_URL,
    baseHeaders: {
      'x-api-key': API_KEY,
    },
  });
  
  const response = await client.fetch({
    url: '/public/oauth/token',
    method: 'post',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response?.success) {
    logDeep(response);
    return response;
  }

  const { 
    access_token: accessToken, 
    refresh_token: newRefreshToken,
  } = response.result;

  await upstashSet(`etsy_access_token_${ credsPath || 'default' }`, accessToken);
  await upstashSet(refreshTokenKey, newRefreshToken);

  logDeep(response);
  return response;
};

const etsyAccessTokenRefreshApi = async (req, res) => {
  const {
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyAccessTokenRefresh(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyAccessTokenRefresh,
  etsyAccessTokenRefreshApi,
};

// curl localhost:8000/etsyAccessTokenRefresh