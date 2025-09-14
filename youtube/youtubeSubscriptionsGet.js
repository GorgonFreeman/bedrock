// https://developers.google.com/youtube/v3/docs/subscriptions/list

const { funcApi, logDeep } = require('../utils');
const { youtubeClient } = require('./youtube.utils');

const youtubeSubscriptionsGet = async (
  channelId,
  {
    credsPath,
    part = 'snippet,contentDetails',
    maxResults = 50,
    order = 'alphabetical',
  } = {},
) => {
  const url = '/subscriptions';
  const params = {
    part,
    channelId,
    maxResults,
    order,
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

const youtubeSubscriptionsGetApi = funcApi(youtubeSubscriptionsGet, {
  argNames: ['channelId', 'options'],
  validatorsByArg: {
    channelId: Boolean,
  },
});

module.exports = {
  youtubeSubscriptionsGet,
  youtubeSubscriptionsGetApi,
};

// curl localhost:8000/youtubeSubscriptionsGet -H "Content-Type: application/json" -d '{ "channelId": "UCsBjURrPoezykLs9EqgamOA" }'
