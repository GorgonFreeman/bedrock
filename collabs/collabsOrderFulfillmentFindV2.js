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