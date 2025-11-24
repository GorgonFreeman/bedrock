const { funcApi } = require('../utils');

const collabsOrderSyncReviewV2 = async (
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

const collabsOrderSyncReviewV2Api = funcApi(collabsOrderSyncReviewV2, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsOrderSyncReviewV2,
  collabsOrderSyncReviewV2Api,
};

// curl localhost:8000/collabsOrderSyncReviewV2 -H "Content-Type: application/json" -d '{ "arg": "1234" }'