// https://developers.google.com/youtube/v3/docs/videos/list

const { funcApi, logDeep } = require('../utils');
const { youtubeClient } = require('./youtube.utils');

const youtubeVideosGet = async (
  videoIds,
  {
    credsPath,
    part = 'snippet,contentDetails,statistics,status',
    maxResults = 50,
  } = {},
) => {
  const url = '/videos';
  const params = {
    part,
    id: Array.isArray(videoIds) ? videoIds.join(',') : videoIds,
    maxResults,
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

const youtubeVideosGetApi = funcApi(youtubeVideosGet, {
  argNames: ['videoIds', 'options'],
  validatorsByArg: {
    videoIds: Boolean,
  },
});

module.exports = {
  youtubeVideosGet,
  youtubeVideosGetApi,
};

// curl localhost:8000/youtubeVideosGet -H "Content-Type: application/json" -d '{ "videoIds": ["PeMlggyqz0Y", "ukzFI9rgwfU"] }'
