// https://developers.asana.com/reference/createenumoptionforcustomfield

const { HOSTED } = require('../constants');
const { funcApi, logDeep, objHasAny } = require('../utils');
const { asanaClient, resolveCustomFieldId } = require('../asana/asana.utils');

const asanaCustomFieldValueAdd = async (
  customFieldIdentifier,
  customFieldValue,
  projectIdentifier,
  {
    credsPath,
    fields,
    pretty,
  } = {},
) => {

  const customFieldIdResponse = await resolveCustomFieldId(
    customFieldIdentifier,
    projectIdentifier,
    { credsPath },
  );

  const {
    success: customFieldIdSuccess,
    result: customFieldId,
  } = customFieldIdResponse;

  if (!customFieldIdSuccess) {
    return customFieldIdResponse;
  }

  fields = Array.isArray(fields) ? fields.join(',') : fields;

  const params = {
    ...(fields ? { opt_fields: fields } : {}),
    ...(pretty ? { opt_pretty: pretty } : {}),
  };

  const response = await asanaClient.fetch({
    url: `/custom_fields/${ customFieldId }/enum_options`,
    method: 'post',
    body: {
      data: {
        name: customFieldValue,
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

const asanaCustomFieldValueAddApi = funcApi(asanaCustomFieldValueAdd, {
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
  asanaCustomFieldValueAdd,
  asanaCustomFieldValueAddApi,
};

// curl localhost:8000/asanaCustomFieldValueAdd -H "Content-Type: application/json" -d '{ "customFieldIdentifier": { "customFieldName": "Epic" }, "customFieldValue": "Freeze Ray Development", "projectIdentifier": { "projectHandle": "dev" } }'
