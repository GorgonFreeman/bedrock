// https://developers.asana.com/reference/createtask

const { HOSTED } = require('../constants');
const { DEV_PROJECT_ID } = require('../asana/asana.constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaTaskCreate = async (
  {
    credsPath,
    
    // params
    fields,
    pretty,
    
    // body
    name = "New Task",
    projects = [ DEV_PROJECT_ID ],
  } = {},
) => {

  const data = {
    ...(name ? { name } : {}),
    ...(projects.length > 0 ? { projects: projects } : {}),
  };

  const params = {
    ...(fields ? { opt_fields: fields } : {}),
    ...(pretty ? { opt_pretty: pretty } : {}),
  };

  const response = await asanaClient.fetch({
    url: `/tasks`,
    method: 'post',
    params,
    body: {
      data,
    },
    context: {
      credsPath,
    },
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaTaskCreateApi = funcApi(asanaTaskCreate, {
  argNames: ['options'],
});

module.exports = {
  asanaTaskCreate,
  asanaTaskCreateApi,
};

// curl localhost:8000/asanaTaskCreate -H "Content-Type: application/json" -d '{ "options": { "name": "New Task", "projects": ["1208942389126559"] } }'