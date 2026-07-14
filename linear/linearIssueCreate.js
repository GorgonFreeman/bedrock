// https://linear.app/developers/graphql

const { funcApi, objHasAll, logDeep } = require('../utils');
const { linearClient } = require('../linear/linear.utils');

const defaultAttrs = `
  id
  identifier
  title
  createdAt
  updatedAt
`;

const linearIssueCreate = async (
  title,
  teamId,
  {
    credsPath,

    assigneeId,
    description,
    dueDate,
    priority,
    projectId,
    stateId,

    attrs = defaultAttrs,
  } = {},
) => {

  const createPayload = {
    title,
    teamId,
    ...assigneeId && { assigneeId },
    ...description && { description },
    ...dueDate && { dueDate },
    ...priority && { priority },
    ...projectId && { projectId },
    ...stateId && { stateId },
  };

  const query = `
    mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          ${ attrs }
        }
      }
    }
  `;

  const response = await linearClient.fetch({
    method: 'post',
    body: {
      query,
      variables: {
        input: createPayload,
      },
    },
    context: {
      credsPath,
      resultsNode: 'issueCreate',
    },
  });

  if (response.success && response.result?.issue) {
    const unwrapped = {
      ...response,
      result: response.result.issue,
    };
    logDeep(unwrapped);
    return unwrapped;
  }

  logDeep(response);
  return response;
};

const linearIssueCreateApi = funcApi(linearIssueCreate, {
  argNames: ['createPayload', 'options'],
  validatorsByArg: {
    createPayload: p => objHasAll(p, ['title', 'teamId']),
  },
});

module.exports = {
  linearIssueCreate,
  linearIssueCreateApi,
};

// curl localhost:8000/linearIssueCreate -H "Content-Type: application/json" -d '{ "createPayload": { "title": "New exception", "teamId": "9cfb482a-81e3-4154-b5b9-2c805e70a02d", "description": "More detailed error report in markdown" } }'
