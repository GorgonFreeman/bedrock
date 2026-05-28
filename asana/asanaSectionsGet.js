// https://developers.asana.com/reference/getsectionsforproject

const { HOSTED } = require('../constants');
const { funcApi, logDeep, objHasAny } = require('../utils');
const { asanaGet, resolveProjectId } = require('../asana/asana.utils');

const asanaSectionsGet = async (
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

  projectId = resolveProjectId({ projectId, projectHandle });
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

  const response = await asanaGet(`/projects/${ projectId }/sections`, {
    credsPath,
    params,
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaSectionsGetApi = funcApi(asanaSectionsGet, {
  argNames: ['projectIdentifier', 'options'],
  validatorsByArg: {
    projectIdentifier: p => objHasAny(p, ['projectId', 'projectHandle']),
  },
});

module.exports = {
  asanaSectionsGet,
  asanaSectionsGetApi,
};

// curl localhost:8000/asanaSectionsGet -X POST -H "Content-Type: application/json" -d '{ "projectIdentifier": { "projectHandle": "dev" } }'