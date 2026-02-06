// https://developers.asana.com/reference/gettasks

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaTasksGet = async (
  metafilter, // The API method requires some of a subset of options to filtering to begin returning tasks.
  {
    credsPath,

    project,
    tag,
    assignee,
    workspace,
  } = {},
) => {

  const {
    project: metafilterProject,
    tag: metafilterTag,
    assignee: metafilterAssignee,
    workspace: metafilterWorkspace,
  } = metafilter;

  const response = await asanaClient.fetch({
    url: `/tasks`,
    context: {
      credsPath,
    },
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

// curl localhost:8000/asanaTasksGet