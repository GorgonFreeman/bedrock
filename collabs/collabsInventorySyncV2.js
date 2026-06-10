const { funcApi } = require('../utils');

const collabsInventorySyncV2 = async (
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

const collabsInventorySyncV2Api = funcApi(collabsInventorySyncV2, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsInventorySyncV2,
  collabsInventorySyncV2Api,
};

// curl localhost:8000/collabsInventorySyncV2 -H "Content-Type: application/json" -d '{ "arg": "1234" }'