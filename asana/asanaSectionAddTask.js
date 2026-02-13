// https://developers.asana.com/reference/addtaskforsection

const { HOSTED } = require('../constants');
const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');
const { asanaSectionsGet } = require('../asana/asanaSectionsGet');

const asanaSectionAddTaskSingle = async (
  {
    sectionId,

    sectionName,
    projectIdentifier,
  },
  taskId,
  {
    credsPath,

    pretty,
  } = {},
) => {

  if (!sectionId && sectionName) {
    if (!projectIdentifier) {
      return {
        success: false,
        error: [`sectionName and projectIdentifier are required when sectionId is not provided`],
      };
    }

    const sectionsResponse = await asanaSectionsGet(
      projectIdentifier, 
      { 
        credsPath,
      },
    );

    const {
      success: sectionsSuccess,
      result: sections,
    } = sectionsResponse;

    if (!sectionsSuccess) {
      return sectionsResponse;
    }

    sectionId = sections.find(section => section.name === sectionName)?.gid;
  }

  if (!sectionId) {
    return {
      success: false,
      error: [`Section "${ sectionName }" not found in project`],
    };
  }

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

const asanaSectionAddTask = async (
  sectionIdentifier,
  taskId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    taskId,
    asanaSectionAddTaskSingle,
    (taskId) => ({
      args: [sectionIdentifier, taskId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );

  !HOSTED && logDeep(response);
  return response;
};

const asanaSectionAddTaskApi = funcApi(asanaSectionAddTask, {
  argNames: ['sectionIdentifier', 'taskId', 'options'],
  validatorsByArg: {
    sectionIdentifier: Boolean,
    taskId: Boolean,
  },
});

module.exports = {
  asanaSectionAddTask,
  asanaSectionAddTaskApi,
};

// curl localhost:8000/asanaSectionAddTask -X POST -H "Content-Type: application/json" -d '{ "sectionIdentifier": { "sectionId": "1208942389126569" }, "taskId": "1210943776817196" }'
// curl localhost:8000/asanaSectionAddTask -X POST -H "Content-Type: application/json" -d '{ "sectionIdentifier": { "sectionName": "UAT", "projectIdentifier": { "projectHandle": "dev" } }, "taskId": "1210943776817196" }'