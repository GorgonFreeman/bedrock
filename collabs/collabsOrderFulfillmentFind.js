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
        displayFulfillmentStatus
        fulfillments(first: 250) {
          trackingInfo(first: 250) {
            company
            number
            url
          }
          status
        }
        lineItems(first: 250) {
          edges {
            node {
              id
              unfulfilledQuantity
            }
          }
        }
      `,
    },
  );

  const { success: shopifyOrderSuccess, result: shopifyOrder } = shopifyOrderResponse;
  if (!shopifyOrderSuccess) {
    return shopifyOrderResponse;
  }

  const { 
    id: shopifyOrderGid,
    name: shopifyOrderName,
    displayFulfillmentStatus,
    fulfillments,
    lineItems,
  } = shopifyOrder;
  const shopifyOrderId = gidToId(shopifyOrderGid);

  const DONE_STATUSES = [
    'FULFILLED',
  ];

  // TODO: Handle other fulfillment statuses

  if (DONE_STATUSES.includes(displayFulfillmentStatus)) {
    return { 
      success: true, 
      result: {
        message: `Order already ${ displayFulfillmentStatus }, nothing to fulfill.`,
      },
    };
  }

  logDeep({ shopifyOrder });

  const trackingNumbersSeen = fulfillments.map(f => f.trackingInfo.map(t => t.number)).flat();
  logDeep({ trackingNumbersSeen });

  const outstandingLineItems = lineItems.filter(li => li.unfulfilledQuantity > 0);
  logDeep({ outstandingLineItems });

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

    const itemsByTrackingNumber = arrayToObj(shipmentInfo, { keyProp: 'trackingNumber', uniqueByKeyProp: false });

    for (const [trackingNumber, items] of Object.entries(itemsByTrackingNumber)) {

      if (trackingNumbersSeen.includes(trackingNumber)) {
        continue;
      }

      logDeep({ trackingNumber, items });
      await askQuestion('Unfulfilled shipment?');
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