// https://developers.asana.com/reference/gettasks

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaGet, resolveProjectId, resolveWorkspaceId } = require('../asana/asana.utils');
const { asanaSectionGetByName } = require('../asana/asanaSectionGetByName');

const asanaTasksGet = async (
  metafilter, // The API method requires some of a subset of options to filtering to begin returning tasks.
  {
    credsPath,

    projectIdentifier,
    tag,
    assignee,
    workspaceIdentifier,
    sectionIdentifier,
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
    sectionIdentifier: metafilterSectionIdentifier,
  } = metafilter;

  projectIdentifier = projectIdentifier || metafilterProjectIdentifier;
  tag = tag || metafilterTag;
  assignee = assignee || metafilterAssignee;
  workspaceIdentifier = workspaceIdentifier || metafilterWorkspaceIdentifier;
  sectionIdentifier = sectionIdentifier || metafilterSectionIdentifier;

  let projectId;
  let workspaceId;
  let sectionId;

  if (projectIdentifier) {

    projectId = resolveProjectId(projectIdentifier);
    
    if (!projectId) {
      return {
        success: false,
        error: [`Couldn't get a project ID from projectIdentifier`],
      };
    }
  }

  if (workspaceIdentifier) {

    workspaceId = resolveWorkspaceId(workspaceIdentifier);

    if (!workspaceId) {
      return {
        success: false,
        error: [`Couldn't get a workspace ID from workspaceIdentifier`],
      };
    }
  }

  if (sectionIdentifier) {

    const {
      sectionId: id,
  
      sectionName: name,
      projectIdentifier: sectionIdentifierProjectIdentifier = projectIdentifier, // default to global project identifier
    } = sectionIdentifier;

    if (id) {
      sectionId = id;
    } else {

      const sectionResponse = await asanaSectionGetByName(name, sectionIdentifierProjectIdentifier, { credsPath });

      const {
        success: sectionSuccess,
        result: section,
      } = sectionResponse;

      if (!sectionSuccess) {
        return sectionResponse;
      }

      sectionId = section?.gid;
    }
  }

  fields = fields !== undefined && Array.isArray(fields) ? fields.join(',') : fields;

  const params = {
    ...(projectId !== undefined && { project: projectId }),
    ...(tag !== undefined && { tag }),
    ...(assignee !== undefined && { assignee }),
    ...(workspaceId !== undefined && { workspace: workspaceId }),
    ...(sectionId !== undefined && { section: sectionId }),
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
    metafilter: p => p?.projectIdentifier || p?.tag || (p?.assignee && p?.workspaceIdentifier) || p?.sectionIdentifier,
  },
});

module.exports = {
  asanaTasksGet,
  asanaTasksGetApi,
};

// curl localhost:8000/asanaTasksGet -H "Content-Type: application/json" -d '{ "metafilter": { "projectIdentifier": { "projectHandle": "dev" } } }'
// curl localhost:8000/asanaTasksGet -H "Content-Type: application/json" -d '{ "metafilter": { "sectionIdentifier": { "sectionName": "UAT", "projectIdentifier": { "projectHandle": "dev" } } } }'