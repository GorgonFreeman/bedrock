const { funcApi } = require('../utils');

const collabsOrderFulfillmentFind = async (
  store,
  orderIdentifier,
) => {

  return { 
    success: true,
    result: {
      store,
      orderIdentifier,
    },
  };
  
};

const collabsOrderFulfillmentFindApi = funcApi(collabsOrderFulfillmentFind, {
  argNames: ['store', 'orderIdentifier'],
});

module.exports = {
  collabsOrderFulfillmentFind,
  collabsOrderFulfillmentFindApi,
};

// curl localhost:8000/collabsOrderFulfillmentFind -H "Content-Type: application/json" -d '{ "store": "us", "orderIdentifier": { "orderName": "USA4826603" } }'