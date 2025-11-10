const { funcApi } = require('../utils');

const collabsCustomsDataCleanse = async () => {

  return { 
    arg, 
    option,
  };
  
};

const collabsCustomsDataCleanseApi = funcApi(collabsCustomsDataCleanse, {
  argNames: ['options'],
});

module.exports = {
  collabsCustomsDataCleanse,
  collabsCustomsDataCleanseApi,
};

// curl localhost:8000/collabsCustomsDataCleanse