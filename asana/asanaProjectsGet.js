// https://developers.asana.com/reference/getprojects

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaGet } = require('../asana/asana.utils');

const asanaProjectsGet = async (
  {
    credsPath,

    offset,
    perPage,

    fields,
    pretty,

    workspace,
    archived,
  } = {},
) => {

  const params = {
    ...offset !== undefined && { offset },
    ...perPage !== undefined && { limit: perPage },
    ...fields !== undefined && { opt_fields: fields },
    ...pretty !== undefined && { opt_pretty: pretty },
    ...workspace !== undefined && { workspace },
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
  argNames: ['options'],
});

module.exports = {
  asanaProjectsGet,
  asanaProjectsGetApi,
};

// curl localhost:8000/asanaProjectsGet