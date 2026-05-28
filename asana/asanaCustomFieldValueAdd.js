// https://developers.asana.com/docs/custom-fields-guide
 
const { funcApi } = require('../utils');

const asanaCustomFieldValueAdd = async (
  // customFieldIdentifier
  {
    customFieldId,
    customFieldName,
  },
  customFieldValue,
  projectIdentifier,
  {
    credsPath,
  } = {},
) => {

  return { 
    arg, 
    option,
  };
  
};

const asanaCustomFieldValueAddApi = funcApi(asanaCustomFieldValueAdd, {
  argNames: [
    'customFieldIdentifier',
    'customFieldValue',
    'projectIdentifier',
    'options',
  ],
  validatorsByArg: {
    customFieldIdentifier: Boolean,
    customFieldValue: Boolean,
    projectIdentifier: Boolean,
  },
});

module.exports = {
  asanaCustomFieldValueAdd,
  asanaCustomFieldValueAddApi,
};

// curl localhost:8000/asanaCustomFieldValueAdd -H "Content-Type: application/json" -d '{ "customFieldIdentifier": { "customFieldName": "Epic" }, "customFieldValue": "Freeze Ray Development", "projectIdentifier": { "projectHandle": "dev" } }'