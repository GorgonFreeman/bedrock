// https://developers.asana.com/reference/getworkspaces

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaGet } = require('../asana/asana.utils');

const asanaWorkspacesGet = async (
  {
    credsPath,

    offset,
    perPage,

    fields,
    pretty,
  } = {},
) => {

  const params = {
    ...offset !== undefined && { offset },
    ...perPage !== undefined && { limit: perPage },
    ...fields !== undefined && { opt_fields: fields },
    ...pretty !== undefined && { opt_pretty: pretty },
  };

  const response = await asanaGet('/workspaces', {
    credsPath,
    params,
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaWorkspacesGetApi = funcApi(asanaWorkspacesGet, {
  argNames: ['options'],
});

module.exports = {
  asanaWorkspacesGet,
  asanaWorkspacesGetApi,
};

// curl localhost:8000/asanaWorkspacesGet