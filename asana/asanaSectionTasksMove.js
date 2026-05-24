const { asanaTasksGet } = require('./asanaTasksGet');
const { asanaSectionAddTask } = require('./asanaSectionAddTask');

const { funcApi } = require('../utils');

const isValidSectionIdentifier = (p) => (p?.sectionName && p?.projectIdentifier) || p?.sectionId;
const isValidSectionIdentifierProjectOptional = (p) => p?.sectionName || p?.sectionId;

const asanaSectionTasksMove = async (
  fromSectionIdentifier,
  toSectionIdentifier,
  {
    credsPath,
  } = {},
) => {

  toSectionIdentifier.projectIdentifier = toSectionIdentifier.projectIdentifier || fromSectionIdentifier?.projectIdentifier;

  const tasksResponse = await asanaTasksGet(
    { sectionIdentifier: fromSectionIdentifier }, 
    { credsPath },
  );

  const {
    success: tasksSuccess,
    result: tasks,
  } = tasksResponse;

  if (!tasksSuccess) {
    return tasksResponse;
  }

  const taskIds = (tasks ?? []).map(task => task.gid).filter(Boolean);

  if (!taskIds.length) {
    return {
      success: false,
      error: [`No tasks found in section`],
    };
  }

  const moveResponse = await asanaSectionAddTask(
    toSectionIdentifier, 
    taskIds, 
    { credsPath },
  );

  return moveResponse;
};

const asanaSectionTasksMoveApi = funcApi(asanaSectionTasksMove, {
  argNames: ['fromSectionIdentifier', 'toSectionIdentifier', 'options'],
  validatorsByArg: {
    fromSectionIdentifier: isValidSectionIdentifier,
    toSectionIdentifier: isValidSectionIdentifierProjectOptional,
  },
});

module.exports = {
  asanaSectionTasksMove,
  asanaSectionTasksMoveApi,
};

// curl localhost:8000/asanaSectionTasksMove -X POST -H "Content-Type: application/json" -d '{ "fromSectionIdentifier": { "sectionName": "UAT", "projectIdentifier": { "projectHandle": "dev" } }, "toSectionIdentifier": { "sectionName": "Done" } }'
