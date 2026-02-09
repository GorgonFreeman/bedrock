// https://developers.asana.com/reference/addtaskforsection

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaSectionAddTask = async (
  sectionId,
  taskId,
  {
    credsPath,

    pretty,
  } = {},
) => {

  const params = {
    ...pretty !== undefined && { opt_pretty: pretty },
  };

  const response = await asanaClient.fetch({
    url: `/sections/${ sectionId }/addTask`,
    method: 'post',
    body: {
      data: {
        task: taskId,
      },
    },
    params,
    context: {
      credsPath,
    },
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaSectionAddTaskApi = funcApi(asanaSectionAddTask, {
  argNames: ['sectionId', 'taskId', 'options'],
  validatorsByArg: {
    sectionId: Boolean,
    taskId: Boolean,
  },
});

module.exports = {
  asanaSectionAddTask,
  asanaSectionAddTaskApi,
};

// curl localhost:8000/asanaSectionAddTask