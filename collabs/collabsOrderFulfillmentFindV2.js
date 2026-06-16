const {
  HOSTED,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
  REGIONS_STARSHIPIT,
} = require('../constants');

const { funcApi, customNullish, gidToId, logDeep, askQuestion } = require('../utils');

const { 
  shopifyRegionToStarshipitAccount,
} = require('../mappings');
const { 
  starshipitTrackingNumberToUrl,
  shopifyStoreToOriginAddress,
} = require('../bedrock_unlisted/mappings');

const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { shopifyOrderFulfill } = require('../shopify/shopifyOrderFulfill');
const { shopifyFulfillmentTrackingInfoUpdate } = require('../shopify/shopifyFulfillmentTrackingInfoUpdate');
const { bleckmannParcelsGet } = require('../bleckmann/bleckmannParcelsGet');
const { starshipitTrackingGet } = require('../starshipit/starshipitTrackingGet');

const INITIAL_FULFILLMENT_METAFIELD = {
  namespace: 'fulfillment',
  key: 'initial',
};

const SHOPIFY_ORDER_ATTRS = `
  id
  name
  displayFulfillmentStatus
  shippingLine {
    title
  }
  mfInitialFulfillment: metafield(namespace: "${ INITIAL_FULFILLMENT_METAFIELD.namespace }", key: "${ INITIAL_FULFILLMENT_METAFIELD.key }") {
    value
  }
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
  fulfillmentOrders(first: 250) {
    edges {
      node {
        id
        requestStatus
        status
      }
    }
  }
`;

const collabsOrderFulfillmentFindV2 = async (
  store,
  {
    orderIdentifier,
    orderData,
  },
  {
    interactive = false,
    autofulfill = false,
    notifyCustomer = false,
  } = {},
) => {

  if (![
    REGIONS_BLECKMANN,
    REGIONS_STARSHIPIT,
  ].some(regionList => regionList.includes(store))) {
    return { 
      success: false, 
      error: [`No platforms supported for store ${ store }`],
    };
  }

  let shopifyOrder;

  if (orderData) {
    shopifyOrder = orderData;
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

  logDeep(shopifyOrder);

  const { 
    id: shopifyOrderGid,
    name: shopifyOrderName,
    displayFulfillmentStatus,
    fulfillments,
    lineItems,
    fulfillmentOrders,
    shippingLine,
    mfInitialFulfillment,
  } = shopifyOrder;
  const shopifyOrderId = gidToId(shopifyOrderGid);
  const shippingMethod = shippingLine?.title;
  const initialFulfillmentId = mfInitialFulfillment?.value;

  if (!shippingMethod) {
    return {
      success: false,
      error: [`Order doesn't require shipping`],
    };
  }

  if ([
    shopifyOrderId,
    shopifyOrderName,
    displayFulfillmentStatus,
  ].some(i => customNullish(i))) {
    return {
      success: false, 
      error: ['Order data incomplete'],
    };
  }

  let fulfillmentData;

  const originAddress = shopifyStoreToOriginAddress(store);

  const FULFILLMENT_ORDER_CLOSED_STATUSES = [
    'CANCELLED',
    'CLOSED',
  ];

  if (REGIONS_BLECKMANN.includes(store)) {

    if (!fulfillmentOrders?.length) {
      return {
        success: false, 
        error: ['Order data incomplete'],
      };
    }

    logDeep(fulfillmentOrders);
  
    const openFulfillmentOrders = fulfillmentOrders.filter(fulfillmentOrder => !FULFILLMENT_ORDER_CLOSED_STATUSES.includes(fulfillmentOrder.status));

    if (!openFulfillmentOrders?.length) {
      return {
        success: false,
        error: ['Order has no open fulfillment orders'],
      };
    }
    
    for (const fulfillmentOrder of openFulfillmentOrders) {

      logDeep(fulfillmentOrder);

      const { id: fulfillmentOrderGid } = fulfillmentOrder;
      const fulfillmentOrderId = gidToId(fulfillmentOrderGid);
      
      const bleckmannParcelsResponse = await bleckmannParcelsGet({ pickticketId: fulfillmentOrderId }, { includeDetails: true });
      const { success: bleckmannParcelsSuccess, result: bleckmannParcels } = bleckmannParcelsResponse;
      if (!bleckmannParcelsSuccess) {
        return bleckmannParcelsResponse;
      }

      logDeep(bleckmannParcels);
      await askQuestion('?');

      if (!bleckmannParcels?.length) {
        continue;
      }
    }

  } else if (REGIONS_LOGIWA.includes(store)) {

  } else if (REGIONS_STARSHIPIT.includes(store)) {
    const starshipitAccount = shopifyRegionToStarshipitAccount(store, shippingMethod);

    if (!starshipitAccount) {
      return {
        success: false,
        error: [`No Starshipit account found for ${ store }:${ shippingMethod }`],
      };
    }

    const starshipitTrackingResponse = await starshipitTrackingGet(starshipitAccount, { orderNumber: shopifyOrderId });
    logDeep(starshipitTrackingResponse);
    await askQuestion('?');

    const { 
      success: trackingSuccess, 
      result: trackingResult, 
    } = starshipitTrackingResponse;

    if (!trackingSuccess || !trackingResult) {
      return starshipitTrackingResponse;
    }

    const { 
      order_status: orderStatus, 
      carrier_name: carrierName,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
    } = trackingResult;

    // if orderStatus too early, return
    /*
    if (orderStatus.toLowerCase() !== 'dispatched') {
      return {
        success: true,
        code: 204,
        result: {
          message: `Order is not dispatched`,
        },
      }
    }
    */

    // return tracking info if not actioning
    if (!autofulfill) {
      return {
        success: true,
        result: trackingResult,
      };
    }

    const trackingUrlCalculated = trackingUrl
        ? trackingUrl 
        : carrierName && starshipitTrackingNumberToUrl(carrierName, trackingNumber);

    // If fulfillment.initial metafield set, and tracking number available, add tracking to the mentioned fulfillment order
    if (initialFulfillmentId && trackingNumber) {

      const fulfillmentUpdateResponse = await shopifyFulfillmentTrackingInfoUpdate(
        store, 
        initialFulfillmentId, 
        {
          number: trackingNumber,
          ...trackingUrlCalculated && { url: trackingUrlCalculated },
          ...carrierName && { company: carrierName },
        },
        {
          notifyCustomer,
        },
      );
      return fulfillmentUpdateResponse;
    }

    // Fulfill the order with available info
    const fulfillResponse = await shopifyOrderFulfill(
      store, 
      shopifyOrderId, 
      {
        notifyCustomer,
        originAddress,
        trackingInfo: {
          ...trackingNumber && { number: trackingNumber },
          ...trackingUrlCalculated && { url: trackingUrlCalculated },
          ...carrierName && { company: carrierName },
        },
      },
    );

    return fulfillResponse;
    
  }

  if (!fulfillmentData) {
    return {
      success: true,
      code: 204,
      result: {
        message: 'Order is not fulfilled',
      },
    }
  }

  return { 
    success: true,
    result: shopifyOrder,
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

// curl localhost:8000/collabsOrderFulfillmentFindV2 -H "Content-Type: application/json" -d '{ "store": "uk", "shopifyOrderPayload": { "orderIdentifier": { "orderId": "9671147290997" } } }'
// curl localhost:8000/collabsOrderFulfillmentFindV2 -H "Content-Type: application/json" -d '{ "store": "au", "shopifyOrderPayload": { "orderIdentifier": { "orderName": "#AUS6371722" } }, "options": { "autofulfill": true } }'
