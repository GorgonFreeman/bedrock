const { credsByPath } = require('../utils');

const yotpoRequestSetup = ({
  credsPath,
  apiVersion = 'v2',
} = {}) => {

  console.log('yotpoRequestSetup', credsPath, apiVersion);

  const creds = credsByPath(['yotpo', credsPath]);

  const {
    BASE_URL,
    API_KEY,
    GUID,
    // MERCHANT_ID,
  } = creds;

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    'x-guid': GUID,
  };

  return {
    baseUrl: `${ BASE_URL }/${ apiVersion }`,
    headers,
  };
};

module.exports = {
  yotpoRequestSetup,
};