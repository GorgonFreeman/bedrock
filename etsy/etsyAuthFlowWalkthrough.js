const { funcApi, logDeep, askQuestion, wait, seconds } = require('../utils');
const { etsyAuthCodeRequest } = require('../etsy/etsyAuthCodeRequest');
const { etsyAccessTokenRequest } = require('../etsy/etsyAccessTokenRequest');

const etsyAuthFlowWalkthrough = async (
  {
    credsPath,
  } = {},
) => {

  console.log(`1. I'm going to run etsyAuthCodeRequest. A webpage will open. Once you have approved, you will be sent to the redirect url.`);
  await wait(seconds(1));
  await askQuestion('Do it! (Enter to continue)');
  
  // Opens a url, so no proper response payload
  await etsyAuthCodeRequest({ credsPath });
  await wait(seconds(1));

  const authCodeVerifier = await askQuestion(`2. Enter codeVerifier (from logs above): `);
  await wait(seconds(1));
  const authCode = await askQuestion(`3. Enter code (from redirect url params): `);
  await wait(seconds(1));

  console.log('\n');

  const accessTokenRequestResponse = await etsyAccessTokenRequest({ 
    credsPath, 
    authCode, 
    authCodeVerifier, 
  });

  if (!accessTokenRequestResponse?.success) {
    logDeep(accessTokenRequestResponse);
    return accessTokenRequestResponse;
  }
  
  console.log('\n');
  console.log(`AUTH_CODE: ${ authCode }`);
  console.log(`AUTH_CODEVERIFIER: ${ authCodeVerifier }`);
  console.log('\n');

  await wait(seconds(1));

  console.log(`4. Enter the above in .creds.yml for posterity.`);
  await wait(seconds(1));
  await askQuestion('Done! (Enter to continue)');
  console.log('\n');

  await wait(seconds(1));

  console.log(`Ok, you're good to go! o7`);

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