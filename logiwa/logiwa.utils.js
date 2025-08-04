const { credsByPath, CustomAxiosClient, Getter, logDeep, askQuestion, getterAsGetFunction } = require('../utils');

const logiwaRequestSetup = ({ credsPath, apiVersion = 'v3.1' } = {}) => {

  const creds = credsByPath(['logiwa', credsPath]);

  const { 
    BASE_URL,
  } = creds;

  return {
    baseUrl: `${ BASE_URL }/${ apiVersion }`,
  };
};

const logiwaClient = new CustomAxiosClient({
  baseUrl: logiwaRequestSetup().baseUrl,
  factory: logiwaRequestSetup,
});

module.exports = {
  logiwaClient,
};