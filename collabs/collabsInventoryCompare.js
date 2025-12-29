const { funcApi } = require('../utils');

const collabsInventoryCompare = async (
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

const collabsInventoryCompareApi = funcApi(collabsInventoryCompare, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsInventoryCompare,
  collabsInventoryCompareApi,
};

// curl localhost:8000/collabsInventoryCompare -H "Content-Type: application/json" -d '{ "arg": "1234" }'