const { funcApi } = require('../utils');

const collabsOrderFulfillmentReview = async (
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

const collabsOrderFulfillmentReviewApi = funcApi(collabsOrderFulfillmentReview, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsOrderFulfillmentReview,
  collabsOrderFulfillmentReviewApi,
};

// curl localhost:8000/collabsOrderFulfillmentReview -H "Content-Type: application/json" -d '{ "arg": "1234" }'