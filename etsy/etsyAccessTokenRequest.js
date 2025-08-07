const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');
const { upstashGet, upstashSet } = require('../upstash/upstash.utils');

const etsyAccessTokenRequest = async (
  {
    credsPath,
  } = {},
) => {
  
  const creds = credsByPath(['etsy', credsPath]);
  const { 
    API_KEY,
    AUTH_CODE,
    OAUTH_REDIRECT_URL,
    AUTH_CODEVERIFIER,
  } = creds;

  const body = {
    grant_type: 'authorization_code',
    client_id: API_KEY,
    redirect_uri: OAUTH_REDIRECT_URL,
    code: AUTH_CODE,
    code_verifier: AUTH_CODEVERIFIER,
  };

  const response = await etsyClient.fetch({
    method: 'post',
    url: `/public/oauth/token`,
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    context: {
      credsPath,
    },
  });

  if (!response?.success) {
    logDeep(response);
    return response;
  }

  const { 
    access_token: accessToken, 
    refresh_token: refreshToken,
  } = response.result;

  await upstashSet(`etsy_access_token_${ credsPath || 'default' }`, accessToken);
  await upstashSet(`etsy_refresh_token_${ credsPath || 'default' }`, refreshToken);
  
  logDeep(response);
  return response;
};

const etsyAccessTokenRequestApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyAccessTokenRequest(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyAccessTokenRequest,
  etsyAccessTokenRequestApi,
};

// curl localhost:8000/etsyAccessTokenRequest