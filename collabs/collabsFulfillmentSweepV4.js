const { funcApi } = require('../utils');

const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const collabsFulfillmentSweepV4 = async (
  store,
  {
    option,
  } = {},
) => {

  const peoplevoxRelevant = REGIONS_PVX.includes(store);
  const logiwaRelevant = REGIONS_LOGIWA.includes(store);
  const bleckmannRelevant = REGIONS_BLECKMANN.includes(store);

  const anyRelevant = [
    // peoplevoxRelevant, 
    logiwaRelevant, 
    // bleckmannRelevant,
  ].some(Boolean);

  if (!anyRelevant) {
    return {
      success: false,
      message: 'Store not supported',
    };
  }

  return { 
    store, 
    option,
  };
  
};

const collabsFulfillmentSweepV4Api = funcApi(collabsFulfillmentSweepV4, {
  argNames: ['store', 'options'],
});

module.exports = {
  collabsFulfillmentSweepV4,
  collabsFulfillmentSweepV4Api,
};

// curl localhost:8000/collabsFulfillmentSweepV4 -H "Content-Type: application/json" -d '{ "store": "us" }'