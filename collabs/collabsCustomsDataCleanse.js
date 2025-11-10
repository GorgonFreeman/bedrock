const { funcApi } = require('../utils');

const collabsCustomsDataCleanse = async () => {
  
  // 1. Get all data from Style Arcade, Shopify, Peoplevox and Starshipit.

  // 2. Find any HS codes that are not 6-13 digit long numbers, and prepare removal payloads.

  // 3. Provide an import sheet for Style Arcade to finalise the cleanse, as Style Arcade does not have an edit API.

  return {
    success: true,
  };
  
};

const collabsCustomsDataCleanseApi = funcApi(collabsCustomsDataCleanse, {
  argNames: ['options'],
});

module.exports = {
  collabsCustomsDataCleanse,
  collabsCustomsDataCleanseApi,
};

// curl localhost:8000/collabsCustomsDataCleanse