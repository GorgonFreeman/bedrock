const { funcApi } = require('../utils');

const collabsOrderSyncReviewV3 = async (
  region,
  {
    option,
  } = {},
) => {

  return { 
    region, 
    option,
  };
  
};

const collabsOrderSyncReviewV3Api = funcApi(collabsOrderSyncReviewV3, {
  argNames: ['region', 'options'],
});

module.exports = {
  collabsOrderSyncReviewV3,
  collabsOrderSyncReviewV3Api,
};

// curl localhost:8000/collabsOrderSyncReviewV3 -H "Content-Type: application/json" -d '{ "region": "us" }'