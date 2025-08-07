const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

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

  const params = {
    grant_type: 'authorization_code',
    client_id: API_KEY,
    redirect_uri: OAUTH_REDIRECT_URL,
    code: AUTH_CODE,
    code_verifier: AUTH_CODEVERIFIER,
  };

  const response = await etsyClient.fetch({
    url: `/public/oauth/token`,
    params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    context: {
      credsPath,
    },
  });
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