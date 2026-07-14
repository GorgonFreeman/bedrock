// https://linear.app/developers/graphql

const { funcApi, logDeep } = require('../utils');

const { linearTeamHandleToId, linearTeamStateHandleToId, priorityHandleToId } = require('../bedrock_unlisted/mappings');

const { linearIssueCreate } = require('../linear/linearIssueCreate');

const defaultAttrs = `
  id
  identifier
  title
  state {
    id
    name
  }
  team {
    id
    name
  }
  createdAt
  updatedAt
`;

const DEV_TEAM_HANDLE = 'whi';
const DEV_TEAM_STATE_HANDLE = 'triage';

const linearDevIssueCreate = async (
  title,
  {
    credsPath,

    description,
    priorityHandle = 'medium',
    assigneeId,
    dueDate,

    attrs = defaultAttrs,
  } = {},
) => {

  const teamId = linearTeamHandleToId[DEV_TEAM_HANDLE];
  const stateId = linearTeamStateHandleToId[DEV_TEAM_HANDLE][DEV_TEAM_STATE_HANDLE];
  const priorityId = priorityHandleToId[priorityHandle] || 3; // Default to medium priority

  const response = await linearIssueCreate(
    title,
    teamId,
    {
      credsPath,
      stateId,
      ...description && { description },
      ...priorityId && { priorityId },
      ...assigneeId && { assigneeId },
      ...dueDate && { dueDate },
      attrs,
    },
  );

  logDeep(response);
  return response;
};

const linearDevIssueCreateApi = funcApi(linearDevIssueCreate, {
  argNames: ['title', 'options'],
  validatorsByArg: {
    title: Boolean,
  },
});

module.exports = {
  linearDevIssueCreate,
  linearDevIssueCreateApi,
};

// curl localhost:8000/linearDevIssueCreate -H "Content-Type: application/json" -d '{ "title": "Test issue" }'
