const { funcApi } = require('../utils');

const collabsInventoryReviewOnHand = async (
  store,
  {
    option,
  } = {},
) => {

  return { 
    store, 
    option,
  };
  
};

const collabsInventoryReviewOnHandApi = funcApi(collabsInventoryReviewOnHand, {
  argNames: ['store', 'options'],
  validatorsByArg: {
    store: Boolean,
  },
  requireHostedApiKey: true,
  errorReporter: bedrock_unlisted_slackErrorPost,
});

module.exports = {
  collabsInventoryReviewOnHand,
  collabsInventoryReviewOnHandApi,
};

// curl localhost:8000/collabsInventoryReviewOnHand -H "Content-Type: application/json" -d '{ "store": "au" }'