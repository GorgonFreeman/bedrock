// https://developers.google.com/youtube/v3/docs/videoCategories/list

const { funcApi, logDeep } = require('../utils');
const { youtubeClient } = require('./youtube.utils');

const youtubeVideoCategoriesGet = async (
  {
    credsPath,
    part = 'snippet',
    regionCode = 'US',
  } = {},
) => {
  const url = '/videoCategories';
  const params = {
    part,
    regionCode,
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

const youtubeVideoCategoriesGetApi = funcApi(youtubeVideoCategoriesGet, {
  argNames: ['options'],
  validatorsByArg: {},
});

module.exports = {
  youtubeVideoCategoriesGet,
  youtubeVideoCategoriesGetApi,
};

// curl localhost:8000/youtubeVideoCategoriesGet -H "Content-Type: application/json" -d '{}'
