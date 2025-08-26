const { credsByPath, CustomAxiosClient } = require('../utils');

const slackRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['slack', credsPath]);
  const { 
    BASE_URL,
    BOT_TOKEN,
  } = creds;

  const headers = {
    'Authorization': `Bearer ${ BOT_TOKEN }`,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

const commonCreds = slackRequestSetup();
const { baseUrl } = commonCreds;

const slackClient = new CustomAxiosClient({
  baseUrl,
  preparer: slackRequestSetup,
  headers: {
    'Content-Type': 'application/json',
  },
});

module.exports = {
  slackClient,
};