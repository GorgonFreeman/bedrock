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

const ANALYTICS_TEAM_HANDLE = 'ana';
const ANALYTICS_TEAM_STATE_HANDLE = 'backlog';

const linearAnalyticsIssueCreate = async (
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

  const teamId = linearTeamHandleToId[ANALYTICS_TEAM_HANDLE];
  const stateId = linearTeamStateHandleToId[ANALYTICS_TEAM_HANDLE][ANALYTICS_TEAM_STATE_HANDLE];
  const priority = priorityHandleToId[priorityHandle] || 3; // Default to medium priority

  const response = await linearIssueCreate(
    title,
    teamId,
    {
      credsPath,
      stateId,
      ...description && { description },
      ...priority && { priority },
      ...assigneeId && { assigneeId },
      ...dueDate && { dueDate },
      attrs,
    },
  );

  logDeep(response);
  return response;
};

const linearAnalyticsIssueCreateApi = funcApi(linearAnalyticsIssueCreate, {
  argNames: ['title', 'options'],
  validatorsByArg: {
    title: Boolean,
  },
});

module.exports = {
  linearAnalyticsIssueCreate,
  linearAnalyticsIssueCreateApi,
};

// curl localhost:8000/linearAnalyticsIssueCreate -H "Content-Type: application/json" -d '{ "title": "Test analytics issue" }'
