// https://developers.asana.com/reference/createtask

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaTaskCreate = async (
  createPayload,
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
    url: '/tasks',
    method: 'post',
    body: { data: createPayload },
    params,
    context: {
      credsPath,
    },
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaTaskCreateApi = funcApi(asanaTaskCreate, {
  argNames: ['createPayload', 'options'],
  validatorsByArg: {
    createPayload: Boolean,
  },
});

module.exports = {
  asanaTaskCreate,
  asanaTaskCreateApi,
};

// curl localhost:8000/asanaTaskCreate -H "Content-Type: application/json" -d '{ "createPayload": { "name": "Death Star | Reattach exhaust port shielding", "projects": ["1208942389126559"] }, "options": { "fields": ["gid", "name", "permalink_url"] } }'
