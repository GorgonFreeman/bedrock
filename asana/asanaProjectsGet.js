// https://developers.asana.com/reference/getprojects

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaGet } = require('../asana/asana.utils');

const asanaProjectsGet = async (
  workspaceId,
  {
    credsPath,

    offset,
    perPage,

    fields,
    pretty,

    archived,
  } = {},
) => {

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
  argNames: ['workspaceId', 'options'],
  validatorsByArg: {
    workspaceId: Boolean,
  },
});

module.exports = {
  asanaProjectsGet,
  asanaProjectsGetApi,
};

// curl localhost:8000/asanaProjectsGet -H "Content-Type: application/json" -d '{ "workspaceId": "1234567890" }'