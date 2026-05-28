// https://developers.asana.com/reference/createenumoptionforcustomfield

const { HOSTED } = require('../constants');
const { funcApi, logDeep, objHasAny } = require('../utils');
const { asanaClient, asanaGet } = require('../asana/asana.utils');
const { asanaProjectHandleToId } = require('../bedrock_unlisted/mappings');

const resolveProjectId = (projectIdentifier) => {
  const { projectHandle, projectId } = projectIdentifier || {};
  return projectId || asanaProjectHandleToId[projectHandle];
};

const resolveCustomFieldId = async (
  customFieldIdentifier,
  projectIdentifier,
  {
    credsPath,
  } = {},
) => {
  const { customFieldId, customFieldName } = customFieldIdentifier || {};

  if (customFieldId) {
    return {
      success: true,
      result: customFieldId,
    };
  }

  if (!customFieldName) {
    return {
      success: false,
      error: [`customFieldIdentifier requires customFieldId or customFieldName`],
    };
  }

  const projectId = resolveProjectId(projectIdentifier);
  if (!projectId) {
    return {
      success: false,
      error: [`Couldn't get a project ID from projectIdentifier`],
    };
  }

  const customFieldSettingsResponse = await asanaGet(`/projects/${ projectId }/custom_field_settings`, {
    credsPath,
    params: {
      opt_fields: 'custom_field.name,custom_field.gid,custom_field.type',
    },
  });

  const {
    success: customFieldSettingsSuccess,
    result: customFieldSettings,
  } = customFieldSettingsResponse;

  if (!customFieldSettingsSuccess) {
    return customFieldSettingsResponse;
  }

  const customFieldSetting = customFieldSettings?.find(
    setting => setting.custom_field?.name === customFieldName,
  );

  if (!customFieldSetting) {
    return {
      success: false,
      error: [`Custom field "${ customFieldName }" not found in project`],
    };
  }

  return {
    success: true,
    result: customFieldSetting.custom_field.gid,
  };
};

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
