// https://developers.google.com/youtube/v3/docs/search/list

const { funcApi, logDeep } = require('../utils');
const { youtubeClient } = require('./youtube.utils');

const youtubeSearchGet = async (
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

const youtubeSearchGetApi = funcApi(youtubeSearchGet, {
  argNames: ['query', 'options'],
  validatorsByArg: {
    query: Boolean,
  },
});

module.exports = {
  youtubeSearchGet,
  youtubeSearchGetApi,
};

// curl localhost:8000/youtubeSearchGet -H "Content-Type: application/json" -d '{ "query": "How to make portal fluid" }'
