const { funcApi } = require('../utils');

const { collabsInventoryReviewOnHand } = require('../collabs/collabsInventoryReviewOnHand');

const collabsInventorySyncV2 = async (
  store,
  {
    reviewInputs, // Supply review inputs for the function to run the review first,
    reviewOutput, // or supply review output from a previous run.
    spreadsheetIdentifier, // Review output from a sheet
  } = {},
) => {

  

  return { 
    success: true,
    result: {
      store,
      reviewInputs,
      reviewOutput,
      spreadsheetIdentifier,
    },
  };
  
};

const collabsInventorySyncV2Api = funcApi(collabsInventorySyncV2, {
  argNames: [
    'reviewPayload', 
    'options',
  ],
});

module.exports = {
  collabsInventorySyncV2,
  collabsInventorySyncV2Api,
};

// curl localhost:8000/collabsInventorySyncV2 -H "Content-Type: application/json" -d '{ "reviewPayload": { "reviewInputs": { "minReportableDiff": 20 } } }'