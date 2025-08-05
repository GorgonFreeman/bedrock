const { credsByPath, CustomAxiosClient, logDeep } = require('../utils');

const bleckmannRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['bleckmann', credsPath]);
  const { 
    BASE_URL,
    PRIMARY_KEY,
  } = creds;

  const headers = {
    'x-api-key': PRIMARY_KEY,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

const commonCreds = bleckmannRequestSetup();
const { baseUrl } = commonCreds;

const bleckmannClient = new CustomAxiosClient({
  baseUrl,
  factory: bleckmannRequestSetup,
});

module.exports = {
  bleckmannRequestSetup,
  bleckmannClient,
};