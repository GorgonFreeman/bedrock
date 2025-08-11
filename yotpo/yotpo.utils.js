const { credsByPath, CustomAxiosClient, CustomAxiosClientV2 } = require('../utils');

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

const commonCreds = yotpoRequestSetup();
const { baseUrl } = commonCreds;

const yotpoClient = new CustomAxiosClient({
  baseUrl,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  factory: yotpoRequestSetup,
});

const yotpoClientV2 = new CustomAxiosClientV2({
  baseUrl,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  preparer: yotpoRequestSetup,
});

module.exports = {
  yotpoClient,
  yotpoClientV2,
};