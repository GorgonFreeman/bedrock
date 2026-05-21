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
  return true;
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

// curl localhost:8000/asanaSectionTasksMove -X POST -H "Content-Type: application/json" -d '{ "fromSectionIdentifier": { "sectionId": "..." }, "toSectionIdentifier": { "sectionName": "...", "projectIdentifier": { "projectHandle": "..." } } }'
