const { funcApi } = require('../utils');

const asanaViewCreate = async (
  projectIdentifier,
  viewType,
  viewName,
  {
    
  } = {},
) => {

  return { 
    success: true,
    result: false, 
  };
  
};

const asanaViewCreateApi = funcApi(asanaViewCreate, {
  argNames: [
    'projectIdentifier',
    'viewType',
    'viewName',
    'options',
  ],
  validatorsByArg: {
    projectIdentifier: Boolean,
    viewType: Boolean,
    viewName: Boolean,
  },
});

module.exports = {
  asanaViewCreate,
  asanaViewCreateApi,
};

// curl localhost:8000/asanaViewCreate -H "Content-Type: application/json" -d '{ "projectIdentifier": { "projectHandle": "dev" }, "viewType": "board", "viewName": "Freeze Ray Development" }'