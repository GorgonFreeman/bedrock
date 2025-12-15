const { funcApi } = require('../utils');

const collabsOrderSyncCheck = async (
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

const collabsOrderSyncCheckApi = funcApi(collabsOrderSyncCheck, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsOrderSyncCheck,
  collabsOrderSyncCheckApi,
};

// curl localhost:8000/collabsOrderSyncCheck -H "Content-Type: application/json" -d '{ "arg": "1234" }'