const {
  HOSTED,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
  REGIONS_PVX,
} = require('../constants');

const { funcApi } = require('../utils');

const collabsOrderFulfillmentFindV2 = async (
  store,
  {
    orderIdentifier,
    orderData,
  },
  {
    interactive = false,
    autofulfill = false,
  } = {},
) => {

  if (![
    REGIONS_LOGIWA,
  ].some(regionList => regionList.includes(store))) {
    return { 
      success: false, 
      error: [`No platforms supported for store ${ store }`],
    };
  }

  return { 
    arg, 
    option,
  };
  
};

const collabsOrderFulfillmentFindV2Api = funcApi(collabsOrderFulfillmentFindV2, {
  argNames: ['store', 'shopifyOrderPayload', 'options'],
  validatorsByArg: {
    store: Boolean,
    shopifyOrderPayload: Boolean,
  },
});

module.exports = {
  collabsOrderFulfillmentFindV2,
  collabsOrderFulfillmentFindV2Api,
};

// curl localhost:8000/collabsOrderFulfillmentFindV2 -H "Content-Type: application/json" -d '{ "store": "uk", "shopifyOrderPayload": { "orderId": "12345678" } }'