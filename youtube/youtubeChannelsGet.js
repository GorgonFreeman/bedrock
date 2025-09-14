// https://developers.google.com/youtube/v3/docs/channels/list

const { funcApi, logDeep } = require('../utils');
const { youtubeClient } = require('./youtube.utils');

const youtubeChannelsGet = async (
  channelIds,
  {
    credsPath,
    part = 'snippet,contentDetails,statistics,brandingSettings,status',
    maxResults = 50,
  } = {},
) => {
  const url = '/channels';
  const params = {
    part,
    id: Array.isArray(channelIds) ? channelIds.join(',') : channelIds,
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

const youtubeChannelsGetApi = funcApi(youtubeChannelsGet, {
  argNames: ['channelIds', 'options'],
  validatorsByArg: {
    channelIds: Boolean,
  },
});

module.exports = {
  youtubeChannelsGet,
  youtubeChannelsGetApi,
};

// curl localhost:8000/youtubeChannelsGet -H "Content-Type: application/json" -d '{ "channelIds": ["UCsBjURrPoezykLs9EqgamOA"] }'
