// https://developers.asana.com/reference/gettask

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaTaskGet = async (
  taskGid,
  {
    credsPath,
  } = {},
) => {

  const response = await asanaClient.fetch({
    url: `/tasks/${ taskGid }`,
    context: {
      credsPath,
    },
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaTaskGetApi = funcApi(asanaTaskGet, {
  argNames: ['taskGid', 'options'],
  validatorsByArg: {
    taskGid: Boolean,
  },
});

module.exports = {
  asanaTaskGet,
  asanaTaskGetApi,
};

// curl localhost:8000/asanaTaskGet -H "Content-Type: application/json" -d '{ "taskGid": "1213084537812001" }'