// https://developers.asana.com/reference/gettasks

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaGet } = require('../asana/asana.utils');
const { asanaWorkspaceHandleToId } = require('../bedrock_unlisted/mappings');
const { asanaProjectHandleToId } = require('../bedrock_unlisted/mappings');

const asanaTasksGet = async (
  metafilter, // The API method requires some of a subset of options to filtering to begin returning tasks.
  {
    credsPath,

    projectIdentifier,
    tag,
    assignee,
    workspaceIdentifier,
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
    projectIdentifier: metafilterProjectIdentifier,
    tag: metafilterTag,
    assignee: metafilterAssignee,
    workspaceIdentifier: metafilterWorkspaceIdentifier,
  } = metafilter;

  projectIdentifier = projectIdentifier || metafilterProjectIdentifier;
  tag = tag || metafilterTag;
  assignee = assignee || metafilterAssignee;
  workspaceIdentifier = workspaceIdentifier || metafilterWorkspaceIdentifier;

  let projectId;
  let workspaceId;

  if (projectIdentifier) {

    const { projectHandle: handle, projectId: id } = projectIdentifier;

    if (id) {
      projectId = id;
    } else {
      projectId = asanaProjectHandleToId[handle];
    }
    
    if (!projectId) {
      return {
        success: false,
        error: [`Couldn't get a project ID from projectIdentifier`],
      };
    }
  }

  if (workspaceIdentifier) {

    const { workspaceHandle: handle, workspaceId: id } = workspaceIdentifier;

    if (id) {
      workspaceId = id;
    } else {
      workspaceId = asanaWorkspaceHandleToId[handle];
    }

    if (!workspaceId) {
      return {
        success: false,
        error: [`Couldn't get a workspace ID from workspaceIdentifier`],
      };
    }
  }

  const params = {
    ...(projectId !== undefined && { project: projectId }),
    ...(tag !== undefined && { tag }),
    ...(assignee !== undefined && { assignee }),
    ...(workspaceId !== undefined && { workspace: workspaceId }),
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
    metafilter: p => p?.projectIdentifier || p?.tag || (p?.assignee && p?.workspaceIdentifier),
  },
});

module.exports = {
  asanaTasksGet,
  asanaTasksGetApi,
};

// curl localhost:8000/asanaTasksGet -H "Content-Type: application/json" -d '{ "metafilter": { "projectIdentifier": { "projectHandle": "dev" } } }'