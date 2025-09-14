// https://developers.google.com/youtube/v3/docs/search/list

const { respond, mandateParam, logDeep, customAxios, credsByPath } = require('../utils');

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

const youtubeSearchGetApi = async (req, res) => {
  const { 
    query,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'query', query),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await youtubeSearchGet(
    query,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  youtubeSearchGet,
  youtubeSearchGetApi,
};

// curl localhost:8000/youtubeSearchGet -H "Content-Type: application/json" -d '{ "query": "openai" }'
