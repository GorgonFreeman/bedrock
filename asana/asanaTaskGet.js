// https://developers.asana.com/reference/gettask

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaTaskGet = async (
  taskId,
  {
    credsPath,
  } = {},
) => {

  const response = await asanaClient.fetch({
    url: `/tasks/${ taskId }`,
    context: {
      credsPath,
    },
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaTaskGetApi = funcApi(asanaTaskGet, {
  argNames: ['taskId', 'options'],
  validatorsByArg: {
    taskId: Boolean,
  },
});

module.exports = {
  asanaTaskGet,
  asanaTaskGetApi,
};

// curl localhost:8000/asanaTaskGet -H "Content-Type: application/json" -d '{ "taskId": "1213084537812001" }'