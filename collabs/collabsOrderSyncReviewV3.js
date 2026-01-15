const { funcApi } = require('../utils');

const collabsOrderSyncReviewV3 = async (
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

const collabsOrderSyncReviewV3Api = funcApi(collabsOrderSyncReviewV3, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsOrderSyncReviewV3,
  collabsOrderSyncReviewV3Api,
};

// curl localhost:8000/collabsOrderSyncReviewV3 -H "Content-Type: application/json" -d '{ "arg": "1234" }'