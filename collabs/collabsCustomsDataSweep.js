const { funcApi } = require('../utils');
const { REGIONS_WF } = require('../constants');

const collabsCustomsDataSweep = async (
  {
    regions = REGIONS_WF,
  } = {},
) => {

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