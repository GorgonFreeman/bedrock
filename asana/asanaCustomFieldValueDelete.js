// https://developers.asana.com/reference/updateenumoption

const { HOSTED } = require('../constants');
const { funcApi, logDeep, objHasAny } = require('../utils');
const { asanaClient, resolveCustomFieldEnumOptionId } = require('../asana/asana.utils');

const asanaCustomFieldValueDelete = async (
  customFieldIdentifier,
  customFieldValue,
  projectIdentifier,
  {
    credsPath,
    fields,
    pretty,
  } = {},
) => {

  const enumOptionIdResponse = await resolveCustomFieldEnumOptionId(
    customFieldIdentifier,
    customFieldValue,
    projectIdentifier,
    { credsPath },
  );

  const {
    success: enumOptionIdSuccess,
    result: enumOptionId,
  } = enumOptionIdResponse;

  if (!enumOptionIdSuccess) {
    return enumOptionIdResponse;
  }

  fields = Array.isArray(fields) ? fields.join(',') : fields;

  const params = {
    ...(fields ? { opt_fields: fields } : {}),
    ...(pretty ? { opt_pretty: pretty } : {}),
  };

  const response = await asanaClient.fetch({
    url: `/enum_options/${ enumOptionId }`,
    method: 'put',
    body: {
      data: {
        enabled: false,
      },
    },
    params,
    context: {
      credsPath,
    },
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaCustomFieldValueDeleteApi = funcApi(asanaCustomFieldValueDelete, {
  argNames: [
    'customFieldIdentifier',
    'customFieldValue',
    'projectIdentifier',
    'options',
  ],
  validatorsByArg: {
    customFieldIdentifier: p => objHasAny(p, ['customFieldId', 'customFieldName']),
    customFieldValue: Boolean,
    projectIdentifier: p => objHasAny(p, ['projectId', 'projectHandle']),
  },
});

module.exports = {
  asanaCustomFieldValueDelete,
  asanaCustomFieldValueDeleteApi,
};

// curl localhost:8000/asanaCustomFieldValueDelete -H "Content-Type: application/json" -d '{ "customFieldIdentifier": { "customFieldName": "Epic" }, "customFieldValue": "Freeze Ray Development", "projectIdentifier": { "projectHandle": "dev" } }'
