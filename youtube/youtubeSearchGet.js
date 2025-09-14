// https://developers.google.com/youtube/v3/docs/search/list

const { funcApi, logDeep, customAxios, credsByPath } = require('../utils');

const youtubeSearchGet = async (
  query,
  {
    credsPath,
    maxResults = 5,
    order = 'relevance',
    type = 'video',
  } = {},
) => {
  const creds = credsByPath(['youtube', credsPath]);
  const { BASE_URL, API_KEY } = creds;
  
  const url = `${ BASE_URL }/search`;
  const params = {
    part: 'snippet',
    q: query,
    maxResults,
    order,
    type,
    key: API_KEY,
  };

  const response = await customAxios(url, {
    method: 'get',
    params,
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

// curl localhost:8000/youtubeSearchGet -H "Content-Type: application/json" -d '{ "query": "openai" }'
