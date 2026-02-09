// https://developers.asana.com/reference/gettasks

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaGet } = require('../asana/asana.utils');

const asanaTasksGet = async (
  metafilter, // The API method requires some of a subset of options to filtering to begin returning tasks.
  {
    credsPath,

    project,
    tag,
    assignee,
    workspace,
    section,
    completedSince,
    modifiedSince,
    fields,
    pretty,
    offset,
    perPage,
  } = {},
) => {

  const {
    project: metafilterProject,
    tag: metafilterTag,
    assignee: metafilterAssignee,
    workspace: metafilterWorkspace,
  } = metafilter;

  project = project || metafilterProject;
  tag = tag || metafilterTag;
  assignee = assignee || metafilterAssignee;
  workspace = workspace || metafilterWorkspace;

  const params = {
    ...(project !== undefined && { project }),
    ...(tag !== undefined && { tag }),
    ...(assignee !== undefined && { assignee }),
    ...(workspace !== undefined && { workspace }),
    ...(section !== undefined && { section }),
    ...(completedSince !== undefined && { completed_since: completedSince }),
    ...(modifiedSince !== undefined && { modified_since: modifiedSince }),
    ...(fields !== undefined && { opt_fields: fields }),
    ...(pretty !== undefined && { opt_pretty: pretty }),
    ...(offset !== undefined && { offset }),
    ...(perPage !== undefined && { limit: perPage }),
  };

  const response = await asanaGet('/tasks', {
    credsPath,
    params,
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaTasksGetApi = funcApi(asanaTasksGet, {
  argNames: ['metafilter', 'options'],
  validatorsByArg: {
    metafilter: p => p?.project || p?.tag || (p?.assignee && p?.workspace),
  },
});

module.exports = {
  asanaTasksGet,
  asanaTasksGetApi,
};

// curl localhost:8000/asanaTasksGet -H "Content-Type: application/json" -d '{ "metafilter": { "project": "1208942389126559" } }'