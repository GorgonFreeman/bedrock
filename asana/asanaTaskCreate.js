// https://developers.asana.com/reference/createtask

const { HOSTED } = require('../constants');
const { DEV_PROJECT_ID } = require('../asana/asana.constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaTaskCreate = async (
  name,
  {
    credsPath,
    
    // params
    fields,
    pretty,
    
    // body
    projects = [ DEV_PROJECT_ID ], // required, array of project gids
    assignee = "me", // optional, string ("me", email or the gid of a user)
    notes, // optional, string (description of the task)
    followers = [], // optional, array of user gids, emails or just "me"
    tags = [], // optional, array of tag gids
    workspace, // optional, gid of a workspace

    startOn, // optional, date string (YYYY-MM-DD)
    dueOn, // optional, date string (YYYY-MM-DD)
  } = {},
) => {

  const data = {
    name,
    ...(projects.length > 0 ? { projects: projects } : {}),
    ...(assignee ? { assignee } : {}),
    ...(notes ? { notes } : {}),
    ...(startOn ? { start_on: startOn } : {}),
    ...(dueOn ? { due_on: dueOn } : {}),
    ...(followers.length > 0 ? { followers: followers } : {}),
    ...(tags.length > 0 ? { tags: tags } : {}),
    ...(workspace ? { workspace: workspace } : {}),
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
  argNames: ['name', 'options'],
});

module.exports = {
  asanaTaskCreate,
  asanaTaskCreateApi,
};

// curl localhost:8000/asanaTaskCreate -H "Content-Type: application/json" -d '{ "name": "New Task", "options": { "projects": ["1208942389126559"] } }'
// curl localhost:8000/asanaTaskCreate -H "Content-Type: application/json" -d '{ "name": "New Task", "options": { "projects": ["1208942389126559"], "assignee": "zwe@whitefoxboutique.com", "notes": "Do this, do that", "startOn": "2026-05-12", "dueOn": "2026-05-13" } }'