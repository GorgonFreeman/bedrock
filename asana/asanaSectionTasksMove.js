const { asanaTasksGet } = require('./asanaTasksGet');
const { asanaSectionAddTask } = require('./asanaSectionAddTask');

const { funcApi } = require('../utils');

const isValidSectionIdentifier = (p) => (p?.sectionName && p?.projectIdentifier) || p?.sectionId;
const isValidSectionIdentifierProjectOptional = (p) => p?.sectionName || p?.sectionId;

const asanaSectionTasksMove = async (
  {
    fromSectionId,

    fromSectionName,
    fromProjectIdentifier,
  },
  {
    toSectionId,

    toSectionName,
    toProjectIdentifier = fromProjectIdentifier, // if moving within the same project, no need to supply projectId a second time
  },
  {
    credsPath,
  } = {},
) => {

  // Get tasks from section
  // Return if failed
  // Return if no tasks

  // Move tasks to section
  // Return if failed
  
  // return moveResponse;
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

// curl localhost:8000/asanaSectionTasksMove -X POST -H "Content-Type: application/json" -d '{ "fromSectionIdentifier": { "fromSectionName": "UAT", "fromProjectIdentifier": { "projectHandle": "dev" } }, "toSectionIdentifier": { "toSectionName": "Done" } }'
