const { credsByPath, CustomAxiosClient, logDeep } = require('../utils');

const googlesheetsRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['googlesheets', credsPath]);
  const { 
    BASE_URL, 
    API_KEY,
    ACCESS_TOKEN,
  } = creds;

  const baseUrl = BASE_URL || 'https://sheets.googleapis.com/v4';
  const headers = {
    'Content-Type': 'application/json',
  };

  // Use OAuth token if available, otherwise fall back to API key
  if (ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${ ACCESS_TOKEN }`;
  }

  return {
    baseUrl,
    headers,
    params: API_KEY ? {
      key: API_KEY,
    } : {},
  };
};

const googlesheetsClient = new CustomAxiosClient({
  preparer: googlesheetsRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});

module.exports = {
  googlesheetsClient,
  googlesheetsRequestSetup,
};

