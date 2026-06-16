const {
  HOSTED,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
  REGIONS_STARSHIPIT,
} = require('../constants');

const { funcApi, customNullish, gidToId, logDeep, askQuestion } = require('../utils');

const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { bleckmannParcelsGet } = require('../bleckmann/bleckmannParcelsGet');
const { starshipitTrackingGet } = require('../starshipit/starshipitTrackingGet');

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
  } = shopifyOrder;
  const shopifyOrderId = gidToId(shopifyOrderGid);

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
    const starshipitTrackingResponse = await starshipitTrackingGet(store, { orderNumber: shopifyOrderId });
    logDeep(starshipitTrackingResponse);
    await askQuestion('?');
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
// curl localhost:8000/collabsOrderFulfillmentFindV2 -H "Content-Type: application/json" -d '{ "store": "au", "shopifyOrderPayload": { "orderIdentifier": { "orderName": "#AUS6371722" } } }'
