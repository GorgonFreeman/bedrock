// https://developers.asana.com/reference/getworkspaces

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaGet } = require('../asana/asana.utils');

const asanaWorkspacesGet = async (
  {
    credsPath,

    offset,
    perPage,

    option,
  } = {},
) => {

  const params = {
    ...offset !== undefined && { offset },
    ...perPage !== undefined && { limit: perPage },
    ...option !== undefined && { option },
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
  validatorsByArg: {
    // arg: Boolean,
  },
});

module.exports = {
  asanaWorkspacesGet,
  asanaWorkspacesGetApi,
};

// curl localhost:8000/asanaWorkspacesGet