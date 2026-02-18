const { funcApi, logDeep, askQuestion } = require('../utils');
const { etsyAuthCodeRequest } = require('../etsy/etsyAuthCodeRequest');
const { etsyAccessTokenRequest } = require('../etsy/etsyAccessTokenRequest');

const etsyAuthFlowWalkthrough = async (
  {
    credsPath,
  } = {},
) => {

  console.log(`1. I'm going to run etsyAuthCodeRequest. A webpage will open. Once you have approved, you will be sent to the redirect url.`);
  await askQuestion('Do it! (Enter to continue)');
  
  // Opens a url, so no proper response payload
  await etsyAuthCodeRequest({ credsPath });

  const authCodeVerifier = await askQuestion(`2. Enter codeVerifier (from logs above):`);
  const authCode = await askQuestion(`3. Enter code (from redirect url params):`);

  const accessTokenRequestResponse = await etsyAccessTokenRequest({ 
    credsPath, 
    authCode, 
    authCodeVerifier, 
  });

  if (!accessTokenRequestResponse?.success) {
    logDeep(accessTokenRequestResponse);
    return accessTokenRequestResponse;
  }
  
  console.log(`AUTH_CODE: ${ authCode }`);
  console.log(`AUTH_CODEVERIFIER: ${ authCodeVerifier }`);
  console.log(`4. Enter these in .creds.yml for posterity.`);
  await askQuestion('Done! (Enter to continue)');

  console.log(`5. All sorted!`);

  return {
    success: true,
    result: {
      authCode,
      authCodeVerifier,
    },
  };
};

const etsyAuthFlowWalkthroughApi = funcApi(etsyAuthFlowWalkthrough, {
  argNames: ['options'],
});

module.exports = {
  etsyAuthFlowWalkthrough,
  etsyAuthFlowWalkthroughApi,
};

// curl localhost:8000/etsyAuthFlowWalkthrough