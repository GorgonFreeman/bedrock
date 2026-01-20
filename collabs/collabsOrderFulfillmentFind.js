const {
  HOSTED,
  REGIONS_LOGIWA,
} = require('../constants');

const { funcApi, logDeep, askQuestion, gidToId, arrayToObj } = require('../utils');

const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');

const { logiwaOrderGet } = require('../logiwa/logiwaOrderGet');

const collabsOrderFulfillmentFind = async (
  store,
  orderIdentifier,
) => {

  if (![
    REGIONS_LOGIWA,
  ].some(regionList => regionList.includes(store))) {
    return { success: false, error: [`No platforms supported for store ${ store }`] };
  }

  const shopifyOrderResponse = await shopifyOrderGet(
    store, 
    orderIdentifier,
    {
      attrs: `
        id
        name
      `,
    },
  );

  const { success: shopifyOrderSuccess, result: shopifyOrder } = shopifyOrderResponse;
  if (!shopifyOrderSuccess) {
    return shopifyOrderResponse;
  }

  // TODO: Return early if completely fulfilled

  const { 
    id: shopifyOrderGid,
    name: shopifyOrderName,
  } = shopifyOrder;
  const shopifyOrderId = gidToId(shopifyOrderGid);

  if (REGIONS_LOGIWA.includes(store)) {
    const logiwaOrderResponse = await logiwaOrderGet({ orderCode: shopifyOrderName });

    const { success: logiwaOrderSuccess, result: logiwaOrder } = logiwaOrderResponse;
    if (!logiwaOrderSuccess) {
      return { success: false, error: logiwaOrderResponse.error };
    }
    
    // TODO: Centralise Logiwa fulfillment logic for use in sweeps
    // TODO: Consider if the order being found not shipped should be a success or failure
    const {
      shipmentOrderStatusName,
      shipmentInfo,
    } = logiwaOrder;

    if (shipmentOrderStatusName !== 'Shipped') {
      return { 
        success: true, 
        result: {
          message: 'Order not shipped',
        },
      };
    }

    if (!shipmentInfo?.length) {
      return { 
        success: false, 
        error: ['No shipments found'],
      };
    }

    const itemsByShipment = arrayToObj(shipmentInfo, { keyProp: 'carrierPackageReference', uniqueByKeyProp: false });

    logDeep({ itemsByShipment });
    await askQuestion('?');
    
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