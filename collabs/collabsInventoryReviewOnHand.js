const { funcApi } = require('../utils');

const collabsInventoryReviewOnHand = async (
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

const collabsInventoryReviewOnHandApi = funcApi(collabsInventoryReviewOnHand, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsInventoryReviewOnHand,
  collabsInventoryReviewOnHandApi,
};

// curl localhost:8000/collabsInventoryReviewOnHand -H "Content-Type: application/json" -d '{ "arg": "1234" }'