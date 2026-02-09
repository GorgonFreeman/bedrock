// https://developers.asana.com/reference/getprojects

const { HOSTED } = require('../constants');
const { funcApi, logDeep, objHasAny } = require('../utils');
const { asanaGet } = require('../asana/asana.utils');
const { asanaWorkspaceHandleToId } = require('../bedrock_unlisted/mappings');

const asanaProjectsGet = async (
  {
    workspaceHandle,
    workspaceId,
  },
  {
    credsPath,

    offset,
    perPage,

    fields,
    pretty,

    archived,
  } = {},
) => {

  if (workspaceHandle) {
    workspaceId = asanaWorkspaceHandleToId[workspaceHandle];
  }

  if (!workspaceId) {
    return {
      success: false,
      error: ['Couldn\'t get a workspace ID from workspaceIdentifier'],
    };
  }

  const params = {
    ...workspaceId !== undefined && { workspace: workspaceId },
    ...offset !== undefined && { offset },
    ...perPage !== undefined && { limit: perPage },
    ...fields !== undefined && { opt_fields: fields },
    ...pretty !== undefined && { opt_pretty: pretty },
    ...archived !== undefined && { archived },
  };

  const response = await asanaGet('/projects', {
    credsPath,
    params,
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaProjectsGetApi = funcApi(asanaProjectsGet, {
  argNames: ['workspaceIdentifier', 'options'],
  validatorsByArg: {
    workspaceIdentifier: p => objHasAny(p, ['workspaceId', 'workspaceHandle']),
  },
});

module.exports = {
  asanaProjectsGet,
  asanaProjectsGetApi,
};

// curl localhost:8000/asanaProjectsGet -H "Content-Type: application/json" -d '{ "workspaceIdentifier": { "workspaceId": "1234567890" } }'
// curl localhost:8000/asanaProjectsGet -H "Content-Type: application/json" -d '{ "workspaceIdentifier": { "workspaceHandle": "wf" } }'