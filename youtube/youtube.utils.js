const { credsByPath, CustomAxiosClient, logDeep } = require('../utils');

const youtubeRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['youtube', credsPath]);
  const { BASE_URL, API_KEY } = creds;

  const baseUrl = BASE_URL;
  const headers = {
    'Content-Type': 'application/json',
  };

  return {
    baseUrl,
    headers,
    params: {
      key: API_KEY,
    },
  };
};

const youtubeClient = new CustomAxiosClient({
  preparer: youtubeRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

module.exports = {
  youtubeClient,
  youtubeRequestSetup,
};
