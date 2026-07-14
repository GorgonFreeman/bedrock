// https://linear.app/developers/graphql

const { funcApi, logDeep } = require('../utils');

const { linearTeamHandleToId, linearTeamStateHandleToId } = require('../bedrock_unlisted/mappings');

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

const linearDevIssueCreate = async (
  title,
  {
    credsPath,
    
    teamHandle = 'whi',
    stateHandle = 'triage',
    description,
    priority,
    assigneeId,
    dueDate,

    attrs = defaultAttrs,
  } = {},
) => {

  const teamId = linearTeamHandleToId[teamHandle];
  const stateId = linearTeamStateHandleToId[teamHandle][stateHandle];

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
