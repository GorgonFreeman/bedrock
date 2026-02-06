// https://developers.asana.com/reference/gettasks

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaTasksGet = async (
  {
    credsPath,
  } = {},
) => {

  const response = await asanaClient.fetch({
    url: `/tasks`,
    context: {
      credsPath,
    },
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaTasksGetApi = funcApi(asanaTasksGet, {
  argNames: ['options'],
});

module.exports = {
  asanaTasksGet,
  asanaTasksGetApi,
};

// curl localhost:8000/asanaTasksGet