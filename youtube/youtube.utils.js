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
  requiredContext: ['credsPath'],
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  baseInterpreter: async (response, context) => {
    logDeep('youtubeClient response', response);

    if (response?.success) {
      return response;
    }

    const { error } = response;

    if (!error?.length) {
      return response;
    }

    // Handle YouTube API specific errors
    const hasQuotaExceeded = error?.some(err => 
      err?.message?.includes('quotaExceeded') || 
      err?.message?.includes('quota')
    );

    if (hasQuotaExceeded) {
      return {
        ...response,
        error: ['YouTube API quota exceeded. Please try again later.'],
      };
    }

    return response;
  },
});

module.exports = {
  youtubeClient,
  youtubeRequestSetup,
};
