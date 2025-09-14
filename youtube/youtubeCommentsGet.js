// https://developers.google.com/youtube/v3/docs/commentThreads/list

const { funcApi, logDeep } = require('../utils');
const { youtubeClient } = require('./youtube.utils');

const youtubeCommentsGet = async (
  videoId,
  {
    credsPath,
    part = 'snippet,replies',
    maxResults = 20,
    order = 'time',
    searchTerms,
  } = {},
) => {
  const url = '/commentThreads';
  const params = {
    part,
    videoId,
    maxResults,
    order,
    ...(searchTerms && { searchTerms }),
  };

  const response = await youtubeClient.fetch({
    url,
    params,
    context: {
      credsPath: credsPath || 'default',
    },
  });
  
  logDeep(response);
  return response;
};

const youtubeCommentsGetApi = funcApi(youtubeCommentsGet, {
  argNames: ['videoId', 'options'],
  validatorsByArg: {
    videoId: Boolean,
  },
});

module.exports = {
  youtubeCommentsGet,
  youtubeCommentsGetApi,
};

// curl localhost:8000/youtubeCommentsGet -H "Content-Type: application/json" -d '{ "videoId": "PeMlggyqz0Y" }'
