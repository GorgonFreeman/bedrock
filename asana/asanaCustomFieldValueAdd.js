// https://developers.asana.com/reference/createenumoptionforcustomfield

const { HOSTED } = require('../constants');
const { funcApi, logDeep, objHasAny } = require('../utils');
const { asanaClient, resolveCustomFieldId, resolveCustomFieldEnumOptionId } = require('../asana/asana.utils');

const isDuplicateEnumOptionError = (response) => (
  response?.error?.some?.(
    error => error?.data?.errors?.some?.(
      apiError => apiError.error === 'enum_option_duplicate_name',
    ),
  )
);

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

  if (response.success) {
    !HOSTED && logDeep(response);
    return response;
  }

  if (!isDuplicateEnumOptionError(response)) {
    !HOSTED && logDeep(response);
    return response;
  }

  const enumOptionIdResponse = await resolveCustomFieldEnumOptionId(
    customFieldIdentifier,
    customFieldValue,
    projectIdentifier,
    { credsPath },
  );

  if (!enumOptionIdResponse.success) {
    return response;
  }

  const enableResponse = await asanaClient.fetch({
    url: `/enum_options/${ enumOptionIdResponse.result }`,
    method: 'put',
    body: {
      data: {
        enabled: true,
      },
    },
    params,
    context: {
      credsPath,
    },
  });
  
  !HOSTED && logDeep(enableResponse);
  return enableResponse;
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
