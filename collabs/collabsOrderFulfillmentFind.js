const {
  HOSTED,
  REGIONS_LOGIWA,
} = require('../constants');

const { funcApi, logDeep } = require('../utils');

const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');

const collabsOrderFulfillmentFind = async (
  store,
  orderIdentifier,
) => {

  if (![
    REGIONS_LOGIWA,
  ].some(regionList => regionList.includes(store))) {
    return { success: false, error: [`No platforms supported for store ${ store }`] };
  }

  if (REGIONS_LOGIWA.includes(store)) {
    const logiwaOrderResponse = await logiwaOrderGet({ orderCode: orderIdentifier.orderName });
    const { success: logiwaOrderSuccess, result: logiwaOrder } = logiwaOrderResponse;
    if (!logiwaOrderSuccess) {
      return { success: false, error: logiwaOrderResponse.error };
    }
  }

  return { 
    success: false,
    error: ['No fulfillment found, order not conclusively disqualified'],
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