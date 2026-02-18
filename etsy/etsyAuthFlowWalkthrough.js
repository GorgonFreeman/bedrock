const { funcApi, logDeep, askQuestion } = require('../utils');
const { etsyAuthCodeRequest } = require('../etsy/etsyAuthCodeRequest');

const etsyAuthFlowWalkthrough = async (
  {
    credsPath,
  } = {},
) => {

  console.log(`1. I'm going to run etsyAuthCodeRequest. A webpage will open. Once you have approved, you will be sent to the redirect url.`);
  await askQuestion('Do it! (Enter to continue)');

  const authCodeRequestResponse = await etsyAuthCodeRequest({ credsPath });

  if (!authCodeRequestResponse?.success) {
    logDeep(authCodeRequestResponse);
    return authCodeRequestResponse;
  }

  console.log(`2. Copy the codeVerifier above, and the code out of your url. Enter them in .creds.yml as AUTH_CODEVERIFIER and AUTH_CODE.`);
  await askQuestion('Done! (Enter to continue)');
};

const etsyAuthFlowWalkthroughApi = funcApi(etsyAuthFlowWalkthrough, {
  argNames: ['options'],
});

module.exports = {
  etsyAuthFlowWalkthrough,
  etsyAuthFlowWalkthroughApi,
};

// curl localhost:8000/etsyAuthFlowWalkthrough