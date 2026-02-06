// https://developers.asana.com/reference/gettask

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaTaskGet = async (
  taskId,
  {
    credsPath,
    fields,
    pretty,
  } = {},
) => {

  fields = Array.isArray(fields) ? fields.join(',') : fields;
  
  const params = {
    ...(fields ? { opt_fields: fields } : {}),
    ...(pretty ? { opt_pretty: pretty } : {}),
  };

  const response = await asanaClient.fetch({
    url: `/tasks/${ taskId }`,
    params,
    context: {
      credsPath,
    },
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaTaskGetApi = funcApi(asanaTaskGet, {
  argNames: ['taskId', 'options'],
  validatorsByArg: {
    taskId: Boolean,
  },
});

module.exports = {
  asanaTaskGet,
  asanaTaskGetApi,
};

// curl localhost:8000/asanaTaskGet -H "Content-Type: application/json" -d '{ "taskId": "1213084537812001" }'
// curl localhost:8000/asanaTaskGet -H "Content-Type: application/json" -d '{ "taskId": "1213084537812001", "options": { "fields": ["assignee", "workspace", "name"] } }'