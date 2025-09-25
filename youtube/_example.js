const { funcApi, logDeep, customAxios, credsByPath } = require('../utils');

const FUNC = async (
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

const FUNCApi = funcApi(FUNC, {
  argNames: ['query', 'options'],
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "query": "machine learning" }'
