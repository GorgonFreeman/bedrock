const { funcApi } = require('../utils');
const { REGIONS_WF } = require('../constants');

const collabsCustomsDataSweep = async (
  {
    regions = REGIONS_WF,
  } = {},
) => {

  // 1. Get all customs data from Style Arcade - this is the source of truth.
  // 1a. Get all customs data from Peoplevox.
  // 1b. Get all customs data from Starshipit.
  // 1c. Get all customs data from Shopify.

  // 2. Assess all data and identify updates.

  // 3. Action all updates.

  return true;
  
};

const collabsCustomsDataSweepApi = funcApi(collabsCustomsDataSweep, {
  argNames: ['options'],
});

module.exports = {
  collabsCustomsDataSweep,
  collabsCustomsDataSweepApi,
};

// curl localhost:8000/collabsCustomsDataSweep