// https://developers.asana.com/reference/updatetask

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaTaskUpdate = async (
  taskId,
  updatePayload,
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
    method: 'put',
    body: { data: updatePayload },
    params,
    context: {
      credsPath,
    },
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaTaskUpdateApi = funcApi(asanaTaskUpdate, {
  argNames: ['taskId', 'updatePayload', 'options'],
  validatorsByArg: {
    taskId: Boolean,
    updatePayload: Boolean,
  },
});

module.exports = {
  asanaTaskUpdate,
  asanaTaskUpdateApi,
};

// curl localhost:8000/asanaTaskUpdate -X PUT -H "Content-Type: application/json" -d '{ "taskId": "1234567890", "updatePayload": { "name": "Death Star | Reattach exhaust port shielding" } }'