const { credsByPath, CustomAxiosClient } = require('../utils');

const starshipitRequestSetup = ({ credsPath } = {}) => {

  const creds = credsByPath(['starshipit', credsPath]);
  // console.log(creds);

  const { 
    BASE_URL,
    API_KEY,
    SUB_KEY,
  } = creds;

  const headers = {
    'StarShipIT-Api-Key': API_KEY,
    'Ocp-Apim-Subscription-Key': SUB_KEY,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

// get base url for use in client
const commonCreds = starshipitRequestSetup();
const { baseUrl } = commonCreds;

const starshipitClient = new CustomAxiosClient({
  baseUrl,
  factory: starshipitRequestSetup,
  baseInterpreter: (response) => {

    if (!response?.result?.success) {
      return {
        success: false,
        error: [response.result],
      };
    }

    return response;
  },
});

module.exports = {
  starshipitClient,
};