const { credsByPath, CustomAxiosClient } = require('../utils');

const etsyRequestSetup = ({ credsPath } = {}) => {

  const { 
    API_KEY,
    BASE_URL,
  } = credsByPath(['etsy', credsPath]);

  const headers = {
    'x-api-key': API_KEY,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

// get base url for use in client
const commonCreds = etsyRequestSetup();
const { baseUrl } = commonCreds;

const etsyClient = new CustomAxiosClient({
  baseUrl,
  factory: etsyRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

module.exports = {
  etsyClient,
};