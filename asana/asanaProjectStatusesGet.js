// https://developers.asana.com/reference/getprojectstatusesforproject

const { HOSTED } = require('../constants');
const { funcApi, logDeep, objHasAny } = require('../utils');
const { asanaGet } = require('../asana/asana.utils');
const { asanaProjectHandleToId } = require('../bedrock_unlisted/mappings');

const asanaProjectStatusesGet = async (
  {
    projectId,
    projectHandle,
  },
  {
    credsPath,

    offset,
    perPage,

    fields,
    pretty,
  } = {},
) => {

  projectId = projectId || asanaProjectHandleToId[projectHandle];
  if (!projectId) {
    return {
      success: false,
      error: [`Couldn't get a project ID from projectIdentifier`],
    };
  }

  fields = Array.isArray(fields) ? fields.join(',') : fields;

  const params = {
    ...offset !== undefined && { offset },
    ...perPage !== undefined && { limit: perPage },
    ...fields !== undefined && { opt_fields: fields },
    ...pretty !== undefined && { opt_pretty: pretty },
  };

  const response = await asanaGet(`/projects/${ projectId }/project_statuses`, {
    credsPath,
    params,
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaProjectStatusesGetApi = funcApi(asanaProjectStatusesGet, {
  argNames: ['projectIdentifier', 'options'],
  validatorsByArg: {
    projectIdentifier: p => objHasAny(p, ['projectId', 'projectHandle']),
  },
});

module.exports = {
  asanaProjectStatusesGet,
  asanaProjectStatusesGetApi,
};

// curl localhost:8000/asanaProjectStatusesGet -X POST -H "Content-Type: application/json" -d '{ "projectIdentifier": { "projectHandle": "dev" } }'