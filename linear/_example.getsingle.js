// https://linear.app/developers/graphql

const { funcApi, objHasAny, logDeep } = require('../utils');
const { linearClient } = require('../linear/linear.utils');

const defaultAttrs = `
  id
`;

const FUNC = async (
  {
    thingId,
    identifier,
  },
  {
    credsPath,
  
    attrs = defaultAttrs,
  } = {},
) => {

  // Many Linear entities accept UUID or short identifier for id
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
        id: thingId || identifier,
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

const FUNCApi = funcApi(FUNC, {
  argNames: ['thingIdentifier', 'options'],
  validatorsByArg: {
    thingIdentifier: p => objHasAny(p, ['thingId', 'identifier']),
  },
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "thingIdentifier": { "thingId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" } }'
// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "thingIdentifier": { "identifier": "BLA-123" } }'
