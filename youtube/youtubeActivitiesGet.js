// https://developers.google.com/youtube/v3/docs/activities/list

const { funcApi, logDeep } = require('../utils');
const { youtubeClient } = require('./youtube.utils');

const youtubeActivitiesGet = async (
  channelId,
  {
    credsPath,
    part = 'snippet,contentDetails',
    maxResults = 50,
  } = {},
) => {
  const url = '/activities';
  const params = {
    part,
    channelId,
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

const youtubeActivitiesGetApi = funcApi(youtubeActivitiesGet, {
  argNames: ['channelId', 'options'],
  validatorsByArg: {
    channelId: Boolean,
  },
});

module.exports = {
  youtubeActivitiesGet,
  youtubeActivitiesGetApi,
};

// curl localhost:8000/youtubeActivitiesGet -H "Content-Type: application/json" -d '{ "channelId": "UCsBjURrPoezykLs9EqgamOA" }'
