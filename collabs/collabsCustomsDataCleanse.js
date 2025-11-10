const { funcApi } = require('../utils');

const collabsCustomsDataCleanse = async (
  arg,
  {
    option,
  } = {},
) => {

  return { 
    arg, 
    option,
  };
  
};

const collabsCustomsDataCleanseApi = funcApi(collabsCustomsDataCleanse, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsCustomsDataCleanse,
  collabsCustomsDataCleanseApi,
};

// curl localhost:8000/collabsCustomsDataCleanse -H "Content-Type: application/json" -d '{ "arg": "1234" }'