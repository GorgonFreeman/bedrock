const { funcApi } = require('../utils');

const collabsInventorySync = async (
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

const collabsInventorySyncApi = funcApi(collabsInventorySync, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsInventorySync,
  collabsInventorySyncApi,
};

// curl localhost:8000/collabsInventorySync -H "Content-Type: application/json" -d '{ "arg": "1234" }'