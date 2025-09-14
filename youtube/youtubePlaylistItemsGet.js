// https://developers.google.com/youtube/v3/docs/playlistItems/list

const { funcApi, logDeep } = require('../utils');
const { youtubeClient } = require('./youtube.utils');

const youtubePlaylistItemsGet = async (
  playlistId,
  {
    credsPath,
    part = 'snippet,contentDetails',
    maxResults = 50,
  } = {},
) => {
  const url = '/playlistItems';
  const params = {
    part,
    playlistId,
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

const youtubePlaylistItemsGetApi = funcApi(youtubePlaylistItemsGet, {
  argNames: ['playlistId', 'options'],
  validatorsByArg: {
    playlistId: Boolean,
  },
});

module.exports = {
  youtubePlaylistItemsGet,
  youtubePlaylistItemsGetApi,
};

// curl localhost:8000/youtubePlaylistItemsGet -H "Content-Type: application/json" -d '{ "playlistId": "PLrAXtmRdnEQy6nuLMOVuF4g2uUQz0fTCl" }'
