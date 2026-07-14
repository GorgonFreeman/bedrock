// https://linear.app/developers/graphql

const { funcApi, objHasAll, logDeep } = require('../utils');
const { linearClient } = require('../linear/linear.utils');

const defaultAttrs = `
  id
`;

const FUNC = async (
  createPayload, // ThingCreateInput
  {
    attrs = defaultAttrs,
    credsPath,
  } = {},
) => {

  const query = `
    mutation ThingCreate($input: ThingCreateInput!) {
      thingCreate(input: $input) {
        success
        thing {
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
      resultsNode: 'thingCreate',
    },
  });

  if (response.success && response.result?.thing) {
    const unwrapped = {
      ...response,
      result: response.result.thing,
    };
    logDeep(unwrapped);
    return unwrapped;
  }

  logDeep(response);
  return response;
};

const FUNCApi = funcApi(FUNC, {
  argNames: ['createPayload', 'options'],
  validatorsByArg: {
    createPayload: Boolean,
  },
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "createPayload": { "name": "Example" } }'
