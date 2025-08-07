const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const crypto = require('crypto');

const { respond, mandateParam, logDeep, credsByPath } = require('../utils');

const etsyAuthCodeRequest = async (
  {
    credsPath,
  } = {},
) => {
  
  const creds = credsByPath(['etsy', credsPath]);
  const { 
    API_KEY,
    OAUTH_URL, 
    OAUTH_REDIRECT_URL,
  } = creds;

  const state = uuidv4();
  // console.log('state', state);

  const generateRandomString = (length) => {
    return crypto
      .randomBytes(Math.ceil(length * 3 / 4))
      .toString('base64')
      .slice(0, length)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    ;
  };

  const generatePkce = () => {
    const codeVerifier = generateRandomString(64);
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    ;
  
    return {
      codeVerifier,
      codeChallenge,
    };
  };

  const { codeVerifier, codeChallenge } = generatePkce();
  // console.log('codeVerifier, codeChallenge', codeVerifier, codeChallenge);

  const etsyScopes = [
    'address_r', 
    'address_w', 
    'billing_r', 
    'cart_r', 
    'cart_w', 
    'email_r', 
    'favorites_r', 
    'favorites_w', 
    'feedback_r', 
    'listings_d', 
    'listings_r', 
    'listings_w', 
    'profile_r', 
    'profile_w', 
    'recommend_r', 
    'recommend_w', 
    'shops_r', 
    'shops_w', 
    'transactions_r', 
    'transactions_w',
  ];

  // https://developer.etsy.com/documentation/essentials/authentication
  const params = {
    response_type: 'code',
    client_id: API_KEY,
    // Add redirect URL in Etsy app page, e.g. https://www.etsy.com/au/developers/edit/__________/callbacks
    redirect_uri: OAUTH_REDIRECT_URL,
    scope: etsyScopes.join('%20'),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };

  const url = `${ OAUTH_URL }?${ Object.entries(params).map(([k,v]) => `${ k }=${ v }`).join('&') }`;
  return exec(`open '${ url }'`);
};

const etsyAuthCodeRequestApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyAuthCodeRequest(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyAuthCodeRequest,
  etsyAuthCodeRequestApi,
};

// curl localhost:8000/etsyAuthCodeRequest