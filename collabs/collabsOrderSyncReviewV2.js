const { funcApi } = require('../utils');

const collabsOrderSyncReviewV2 = async (
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

const collabsOrderSyncReviewV2Api = funcApi(collabsOrderSyncReviewV2, {
  argNames: ['region', 'options'],
});

module.exports = {
  collabsOrderSyncReviewV2,
  collabsOrderSyncReviewV2Api,
};

// curl localhost:8000/collabsOrderSyncReviewV2 -H "Content-Type: application/json" -d '{ "region": "uk" }'