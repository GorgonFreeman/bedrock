const {
  HOSTED,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
  REGIONS_PVX,
} = require('../constants');

const { funcApi, customNullish, gidToId, logDeep } = require('../utils');

const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { bleckmannParcelsGet } = require('../bleckmann/bleckmannParcelsGet');

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

  const { 
    id: shopifyOrderGid,
    name: shopifyOrderName,
    displayFulfillmentStatus,
    fulfillments,
    lineItems,
  } = shopifyOrder;
  const shopifyOrderId = gidToId(shopifyOrderGid);

  logDeep({
    shopifyOrderId,
    shopifyOrderName,
    displayFulfillmentStatus,
    fulfillments,
    lineItems,
  });

  if ([
    shopifyOrderId,
    shopifyOrderName,
    displayFulfillmentStatus,
    fulfillments,
    lineItems,
  ].some(i => customNullish(i))) {
    return {
      success: false, 
      error: ['Order data incomplete'],
    };
  }

  let fulfillmentData;

  if (REGIONS_BLECKMANN.includes(store)) {

    logDeep(fulfillments);

    for (const fulfillmentOrder of fulfillments) {
      const { trackingInfo } = fulfillmentOrder;
      if (!trackingInfo?.length) {
        continue;
      }
      for (const trackingInfoItem of trackingInfo) {
        const { number } = trackingInfoItem;
        if (!number) {
          continue;
        }
        fulfillmentData = number;
      }
    }

  } else if (REGIONS_LOGIWA.includes(store)) {

  } else if (REGIONS_PVX.includes(store)) {

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