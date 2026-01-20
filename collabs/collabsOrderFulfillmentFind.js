const {
  HOSTED,
  REGIONS_LOGIWA,
} = require('../constants');

const { funcApi, logDeep, askQuestion, gidToId, arrayToObj, arrayStandardResponse } = require('../utils');

const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { shopifyOrderFulfill } = require('../shopify/shopifyOrderFulfill');

const { logiwaOrderGet } = require('../logiwa/logiwaOrderGet');

const makeshiftOriginAddress = (store) => {
  return {
    countryCode: {
      au: 'AU',
      uk: 'GB',
      us: 'US',
    }[store],
  };
};

const SHOPIFY_ORDER_ATTRS = `
  id
  name
  displayFulfillmentStatus
  fulfillments(first: 250) {
    trackingInfo(first: 250) {
      number
    }
    status
  }
  lineItems(first: 250) {
    edges {
      node {
        id
        sku
        unfulfilledQuantity
      }
    }
  }
`;

const collabsOrderFulfillmentFind = async (
  store,
  orderIdentifier,
  {
    dataSupplied, // Provide this instead of fetching, if desirable.
  } = {},
) => {

  if (![
    REGIONS_LOGIWA,
  ].some(regionList => regionList.includes(store))) {
    return { success: false, error: [`No platforms supported for store ${ store }`] };
  }

  let shopifyOrder;

  if (dataSupplied?.['shopifyOrder']) {
    shopifyOrder = dataSupplied['shopifyOrder'];
  }
  
  if (!shopifyOrder) {
    const shopifyOrderResponse = await shopifyOrderGet(
      store, 
      orderIdentifier,
      {
        attrs: SHOPIFY_ORDER_ATTRS,
      },
    );

    const { success: shopifyOrderSuccess, result: shopifyOrderResult } = shopifyOrderResponse;
    if (!shopifyOrderSuccess) {
      return shopifyOrderResponse;
    }
    shopifyOrder = shopifyOrderResult;
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

    let logiwaOrder = dataSupplied?.['logiwaOrder'];

    if (!logiwaOrder) {
      const logiwaOrderResponse = await logiwaOrderGet({ orderCode: shopifyOrderName });

      const { success: logiwaOrderSuccess, result: logiwaOrderResult } = logiwaOrderResponse;
      if (!logiwaOrderSuccess) {
        return logiwaOrderResponse;
      }
      logiwaOrder = logiwaOrderResult;
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

    const fulfillResults = [];

    for (const [trackingNumber, items] of Object.entries(itemsByTrackingNumber)) {

      if (trackingNumbersSeen.includes(trackingNumber)) {
        continue;
      }

      logDeep({ trackingNumber, items });
      await askQuestion('Unfulfilled shipment?');

      const shopifyOrderFulfillResponse = await shopifyOrderFulfill(
        store,
        orderIdentifier,
        {
          // notifyCustomer, // true or false
          originAddress: makeshiftOriginAddress(store),
          trackingInfo: {
            number: trackingNumber,
          },
          
          externalLineItems: items,
          externalLineItemsConfig: {
            extSkuProp: 'productSku',
            extQuantityProp: 'packQuantity',
          },
        },
      );

      const { success: shopifyOrderFulfillSuccess, result: shopifyOrderFulfillResult } = shopifyOrderFulfillResponse;
      if (!shopifyOrderFulfillSuccess) {
        return { success: false, error: shopifyOrderFulfillResponse.error };
      }

      logDeep({ shopifyOrderFulfillResult });

      fulfillResults.push(shopifyOrderFulfillResponse);
    }

    return {
      success: true,
      result: {
        message: `Actioned ${ fulfillResults.length } fulfillment${ fulfillResults.length === 1 ? '' : 's' }`,
        fulfillResults,
      },
    };
  }

  return { 
    success: false,
    error: ['No fulfillment found, order not conclusively disqualified'],
  };
  
};

const collabsOrderFulfillmentFindApi = funcApi(collabsOrderFulfillmentFind, {
  argNames: ['store', 'orderIdentifier', 'options'],
});

module.exports = {
  collabsOrderFulfillmentFind,
  collabsOrderFulfillmentFindApi,
  collabsOrderFulfillmentFindSchema: {
    SHOPIFY_ORDER_ATTRS,
  },
};

// curl localhost:8000/collabsOrderFulfillmentFind -H "Content-Type: application/json" -d '{ "store": "us", "orderIdentifier": { "orderName": "USA4826603" } }'