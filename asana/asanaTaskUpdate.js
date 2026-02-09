// https://developers.asana.com/reference/updatetask

const { HOSTED } = require('../constants');
const { funcApi, logDeep, askQuestion, actionMultipleOrSingle } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const { asanaTaskGet } = require('../asana/asanaTaskGet');

let convertedCustomFields;

const asanaTaskUpdateSingle = async (
  taskId,
  updatePayload,
  {
    credsPath,
    fields,
    pretty,
  } = {},
) => {
 
  // Provide custom_fields if you want to use ids.
  // Provide customFields if you want to use strings.
  // I know what imma be doing.
  const { customFields } = updatePayload;

  if (customFields) {
    
    if (!convertedCustomFields) {
      const taskResponse = await asanaTaskGet(taskId, {
        credsPath,
      });

      const {
        success: taskSuccess,
        result: task,
      } = taskResponse;

      if (!taskSuccess) {
        return taskResponse;
      }

      const { custom_fields } = task;

      const customFieldsDataToIdMap = {};

      for (const customField of custom_fields) {
        const { 
          gid: customFieldId,
          name,
          type,
          enum_options,
        } = customField;
        
        customFieldsDataToIdMap[name] = {
          id: customFieldId,
          type,
          ...enum_options && Object.fromEntries(enum_options.map(option => [option.name, option.gid])),
        };
      }

      convertedCustomFields = Object.fromEntries(Object.entries(customFields).map(([name, value]) => {

        const fieldData = customFieldsDataToIdMap[name];

        const { id: fieldId, type: fieldType } = fieldData;

        if (fieldType !== 'enum') {
          return [name, value];    
        }

        const valueId = customFieldsDataToIdMap?.[name]?.[value] ?? value;
        
        return [fieldId, valueId];
      }));
    }

    updatePayload.custom_fields = {
      ...updatePayload?.custom_fields || {},
      ...convertedCustomFields,
    };
  }

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

const asanaTaskUpdate = async (
  taskId,
  updatePayload,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    taskId,
    asanaTaskUpdateSingle,
    (taskId) => ({
      args: [taskId, updatePayload],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
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
// curl localhost:8000/asanaTaskUpdate -X PUT -H "Content-Type: application/json" -d '{ "taskId": ["1212832815359844", "1210943776817196", "1213070882452430", "1212919693148860"], "updatePayload": { "customFields": { "In This Sprint": "Y", "In Next Sprint": "N" } } }'
// curl localhost:8000/asanaTaskUpdate -X PUT -H "Content-Type: application/json" -d '{ "taskId": ["1212832815359844", "1210943776817196", "1213070882452430", "1212919693148860"], "updatePayload": { "customFields": { "In This Sprint": null, "In Next Sprint": null } } }'