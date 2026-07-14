// https://linear.app/developers/graphql

const { funcApi, logDeep } = require('../utils');
const { linearIssueCreate } = require('../linear/linearIssueCreate');

const defaultAttrs = `
  id
`;

const linearDevIssueCreate = async (
  title,
  {
    credsPath,
    
    teamHandle = 'whi',
    stateHandle = 'whi.triage',
    description,
    priority,
    assigneeId,
    dueDate,

    attrs = defaultAttrs,
  } = {},
) => {

  const query = `
    query GetThing($id: String!) {
      thing(id: $id) {
        ${ attrs }
      }
    }
  `;

  const response = await linearClient.fetch({
    method: 'post',
    body: {
      query,
      variables: {
        id: thingId,
      },
    },
    context: {
      credsPath,
      resultsNode: 'thing',
    },
  });

  logDeep(response);
  return response;
};

const linearDevIssueCreateApi = funcApi(linearDevIssueCreate, {
  argNames: ['thingId', 'options'],
  validatorsByArg: {
    thingId: Boolean,
  },
});

module.exports = {
  linearDevIssueCreate,
  linearDevIssueCreateApi,
};

// curl localhost:8000/linearDevIssueCreate -H "Content-Type: application/json" -d '{ "thingId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }'
