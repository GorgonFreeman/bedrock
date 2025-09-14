// https://developers.google.com/youtube/v3/docs/search/list

const { funcApi, logDeep } = require('../utils');
const { youtubeClient } = require('./youtube.utils');

const youtubeSearchGetV2 = async (
  query,
  {
    credsPath,
    maxResults = 5,
    order = 'relevance',
    type = 'video',
  } = {},
) => {
  const url = '/search';
  const params = {
    part: 'snippet',
    q: query,
    maxResults,
    order,
    type,
  };

  const response = await youtubeClient.fetch({
    url,
    params,
    context: {
      credsPath,
    },
  });
  
  logDeep(response);
  return response;
};

const youtubeSearchGetV2Api = funcApi(youtubeSearchGetV2, {
  argNames: ['query', 'options'],
  validatorsByArg: {
    query: Boolean,
  },
});

module.exports = {
  youtubeSearchGetV2,
  youtubeSearchGetV2Api,
};

// curl localhost:8000/youtubeSearchGetV2 -H "Content-Type: application/json" -d '{ "query": "machine learning" }'
