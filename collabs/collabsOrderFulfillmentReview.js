const { funcApi } = require('../utils');

const collabsOrderFulfillmentReview = async (
  arg,
  {
    option,
  } = {},
) => {

  // Get all orders older than 7 days that are not fulfilled.
  // Try it and add more queries as needed.
  // Exclude 'fulfillment_review_exclude' tagged orders.
  // Report to foxtron_mission_control

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