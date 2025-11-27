const { funcApi } = require('../utils');

const collabsInventoryReviewV2 = async (
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

const collabsInventoryReviewV2Api = funcApi(collabsInventoryReviewV2, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsInventoryReviewV2,
  collabsInventoryReviewV2Api,
};

// curl localhost:8000/collabsInventoryReviewV2 -H "Content-Type: application/json" -d '{ "arg": "1234" }'