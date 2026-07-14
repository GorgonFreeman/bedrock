// https://linear.app/developers/graphql

const { funcApi, objHasAny, logDeep } = require('../utils');
const { linearClient } = require('../linear/linear.utils');

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

const linearIssueGet = async (
  {
    issueId,
    identifier,
  },
  {
    credsPath,

    attrs = defaultAttrs,
  } = {},
) => {

  // issue(id) accepts UUID or short identifier e.g. "BLA-123"
  const query = `
    query GetIssue($id: String!) {
      issue(id: $id) {
        ${ attrs }
      }
    }
  `;

  const response = await linearClient.fetch({
    method: 'post',
    body: {
      query,
      variables: {
        id: issueId || identifier,
      },
    },
    context: {
      credsPath,
      resultsNode: 'issue',
    },
  });

  logDeep(response);
  return response;
};

const linearIssueGetApi = funcApi(linearIssueGet, {
  argNames: ['issueIdentifier', 'options'],
  validatorsByArg: {
    issueIdentifier: p => objHasAny(p, ['issueId', 'identifier']),
  },
});

module.exports = {
  linearIssueGet,
  linearIssueGetApi,
};

// curl localhost:8000/linearIssueGet -H "Content-Type: application/json" -d '{ "issueIdentifier": { "issueId": "WHI-223" } }'
// curl localhost:8000/linearIssueGet -H "Content-Type: application/json" -d '{ "issueIdentifier": { "identifier": "WHI-223" } }'
