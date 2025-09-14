// https://developers.google.com/youtube/v3/docs/captions/list

const { funcApi, logDeep } = require('../utils');
const { youtubeClient } = require('./youtube.utils');

const youtubeCaptionsGet = async (
  videoId,
  {
    credsPath,
    part = 'snippet',
  } = {},
) => {
  const url = '/captions';
  const params = {
    part,
    videoId,
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

const youtubeCaptionsGetApi = funcApi(youtubeCaptionsGet, {
  argNames: ['videoId', 'options'],
  validatorsByArg: {
    videoId: Boolean,
  },
});

module.exports = {
  youtubeCaptionsGet,
  youtubeCaptionsGetApi,
};

// curl localhost:8000/youtubeCaptionsGet -H "Content-Type: application/json" -d '{ "videoId": "PeMlggyqz0Y" }'
