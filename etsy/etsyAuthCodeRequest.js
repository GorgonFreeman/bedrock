const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const crypto = require('crypto');

const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

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

  return { codeVerifier, codeChallenge };
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