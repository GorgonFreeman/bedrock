// Check the last sales order to establish how far behind the sync is

const { funcApi, gidToId, askQuestion, logDeep, dateTimeFromNow, hours } = require('../utils');
const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');

const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');

const { logiwaOrdersGet } = require('../logiwa/logiwaOrdersGet');

const { bleckmannPickticketsGet } = require('../bleckmann/bleckmannPickticketsGet');

const collabsOrderSyncCheck = async (
  region,
  {
    option,
  } = {},
) => {

  const regionToShopifyStore = {
    au: 'white-fox-boutique-aus',
    us: 'white-fox-boutique-usa',
    uk: 'white-fox-boutique-uk',
  };

  const shopifyFetchLastFulfilledOrder = async (region) => {

    const startDateTime = {
      au: `${ dateTimeFromNow({ minus: hours(1) }) }`, // AEDT - 1 hour ago
      uk: `${ dateTimeFromNow({ minus: hours(12) }) }`, // GMT - AEDT is 11 hours behind, -12 hours accounts for -1 hour AEDT
      us: `${ dateTimeFromNow({ minus: hours(16) }) }`, // EST - AEDT is 15 hours behind, -16 hours accounts for -1 hour AEDT
    };

    const shopifyOrdersResponse = await shopifyOrdersGet(region, {
      attrs: 'id name displayFulfillmentStatus createdAt updatedAt processedAt metafield (namespace: "shipping", key: "method") { value }',
      queries: [
        'fulfillment_status:fulfilled',
        `processed_at:>${ startDateTime[region] }`,
      ],
      sortKey:'PROCESSED_AT',
      reverse: true,
    });
    return shopifyOrdersResponse;
  };

  const formatDateTimeString = (dateTime) => {
    return `${ new Date(dateTime) }`;
  };

  const pvxRelevant = REGIONS_PVX.includes(region);
  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  const bleckmannRelevant = REGIONS_BLECKMANN.includes(region);
  const anyRelevant = [pvxRelevant, logiwaRelevant, bleckmannRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      error: ['No platform finder relevant to this region'],
    };
  }

  if (pvxRelevant) {

    // Fetch peoplevox orders
    const pvxOrdersResponse = await peoplevoxReportGet('Zwe: Order Sync Check');
    const { success: pvxOrdersSuccess, result: pvxOrders } = pvxOrdersResponse;
    if (!pvxOrdersSuccess) {
      return {
        success: false,
        error: ['Failed to get Peoplevox orders'],
      };
    }
    
    // Get the last sales order number
    const lastSalesOrder = pvxOrders[pvxOrders.length - 1];

    // Fetch the Shopify order
    const shopifyOrdersResponse = await shopifyOrderGet(region, { orderId: lastSalesOrder['Sales order no.']}, { attrs: 'id name createdAt' });
    const { success: shopifyOrdersSuccess, result: shopifyOrder } = shopifyOrdersResponse;
    if (!shopifyOrdersSuccess) {
      return {
        success: false,
        error: ['Failed to get last Shopify order in PVX'],
      };
    }

    // Get the order details and format them for output
    const { id: shopifyOrderId, name: shopifyOrderName, createdAt: shopifyOrderCreatedAt } = shopifyOrder;

    // Fetch the Shopify orders that have been fulfilled
    const shopifyRecentFulfilledOrdersResponse = await shopifyFetchLastFulfilledOrder(region);
    const { success: shopifyRecentFulfilledOrdersSuccess, result: shopifyRecentFulfilledOrders } = shopifyRecentFulfilledOrdersResponse;
    if (!shopifyRecentFulfilledOrdersSuccess) {
      return {
        success: false,
        error: ['Failed to get recent fulfilled Shopify orders'],
      };
    }

    // Find the last fulfilled order that has a shipping method metafield
    const shopifyLastFulfilledOrder = shopifyRecentFulfilledOrders.find(order => order.metafield?.value !== null);
    if (!shopifyLastFulfilledOrder) {
      return {
        success: false,
        error: [`No orders fulfilled in the last hour ${ region.toUpperCase() }`],
      };
    }

    const {
      id: shopifyLastFulfilledOrderId,
      name: shopifyLastFulfilledOrderName,
      displayFulfillmentStatus: shopifyLastFulfilledOrderDisplayFulfillmentStatus,
      createdAt: shopifyLastFulfilledOrderCreatedAt,
      processedAt: shopifyLastFulfilledOrderProcessedAt,
    } = shopifyLastFulfilledOrder;

    return {
      success: true,
      result: {
        lastNewOrder: {
          name: shopifyOrderName,
          id: gidToId(shopifyOrderId),
          link: `https://admin.shopify.com/store/${ regionToShopifyStore[region] }/orders/${ gidToId(shopifyOrderId) }`,
          createdAtString: formatDateTimeString(shopifyOrderCreatedAt),
        },
        lastFulfilledOrder: {
          name: shopifyLastFulfilledOrderName,
          id: gidToId(shopifyLastFulfilledOrderId),
          link: `https://admin.shopify.com/store/${ regionToShopifyStore[region] }/orders/${ gidToId(shopifyLastFulfilledOrderId) }`,
          createdAtString: formatDateTimeString(shopifyLastFulfilledOrderCreatedAt),
          processedAtString: formatDateTimeString(shopifyLastFulfilledOrderProcessedAt),
        },
      },
    };
  }

  if (logiwaRelevant) {

    // Fetch logiwa orders
    const logiwaOrdersResponse = await logiwaOrdersGet({
      createdDateTime_bt: `${ dateTimeFromNow({ minus: hours(1) }) },${ dateTimeFromNow() }`,
    });
    const { success: logiwaOrdersSuccess, result: logiwaOrders } = logiwaOrdersResponse;
    if (!logiwaOrdersSuccess) {
      return {
        success: false,
        error: ['Failed to get logiwa orders'],
      };
    }

    // Find the last logiwa order by createdDateTime
    const lastLogiwaOrder = logiwaOrders.reduce((last, curr) => {
      if (!last) return curr;
      return new Date(curr.createdDateTime) > new Date(last.createdDateTime) ? curr : last;
    }, null);

    if (!lastLogiwaOrder) {
      return {
        success: false,
        error: ['Error finding last logiwa order'],
      };
    }
    let { code: logiwaOrderCode } = lastLogiwaOrder;
    // Remove trailing digits from the code if present
    logiwaOrderCode = logiwaOrderCode.replace(/([.-])\d+$/, '');

    // Fetch the Shopify order
    const shopifyOrderResponse = await shopifyOrderGet(region, { orderName: logiwaOrderCode }, { attrs: 'id name createdAt' });
    const { success: shopifyOrderSuccess, result: shopifyOrder } = shopifyOrderResponse;
    if (!shopifyOrderSuccess) {
      return {
        success: false,
        error: ['Failed to get last Shopify order in Logiwa'],
      };
    }

    // Get the order details and format them for output
    const { id: shopifyOrderId, name: shopifyOrderName, createdAt: shopifyOrderCreatedAt } = shopifyOrder;

    // Fetch the Shopify orders that have been fulfilled
    const shopifyRecentFulfilledOrdersResponse = await shopifyFetchLastFulfilledOrder(region);
    const { success: shopifyRecentFulfilledOrdersSuccess, result: shopifyRecentFulfilledOrders } = shopifyRecentFulfilledOrdersResponse;
    if (!shopifyRecentFulfilledOrdersSuccess) {
      return {
        success: false,
        error: ['Failed to get recent fulfilled Shopify orders'],
      };
    }

    // Find the last fulfilled order that has a shipping method metafield
    const shopifyLastFulfilledOrder = shopifyRecentFulfilledOrders.find(order => order.metafield?.value !== null);
    if (!shopifyLastFulfilledOrder) {
      return {
        success: false,
        error: [`No orders fulfilled in the last hour ${ region.toUpperCase() }`],
      };
    }

    const {
      id: shopifyLastFulfilledOrderId,
      name: shopifyLastFulfilledOrderName,
      createdAt: shopifyLastFulfilledOrderCreatedAt,
      processedAt: shopifyLastFulfilledOrderProcessedAt,
    } = shopifyLastFulfilledOrder;

    return {
      success: true,
      result: {
        lastNewOrder: {
          name: shopifyOrderName,
          id: shopifyOrderId,
          link: `https://admin.shopify.com/store/${ regionToShopifyStore[region] }/orders/${ gidToId(shopifyOrderId) }`,
          createdAtString: formatDateTimeString(shopifyOrderCreatedAt),
        },
        lastFulfilledOrder: {
          name: shopifyLastFulfilledOrderName,
          id: gidToId(shopifyLastFulfilledOrderId),
          link: `https://admin.shopify.com/store/${ regionToShopifyStore[region] }/orders/${ gidToId(shopifyLastFulfilledOrderId) }`,
          createdAtString: formatDateTimeString(shopifyLastFulfilledOrderCreatedAt),
          processedAtString: formatDateTimeString(shopifyLastFulfilledOrderProcessedAt),
        },
      },
    };
  }

  if (bleckmannRelevant) {

    // Fetch bleckmann picktickets
    const bleckmannPickticketsResponse = await bleckmannPickticketsGet({
      createdFrom: `${ dateTimeFromNow({ minus: hours(1) }) }`.replace(/\.\d{3}Z$/, 'Z'),
    });
    const { success: bleckmannPickticketsSuccess, result: bleckmannPicktickets } = bleckmannPickticketsResponse;
    if (!bleckmannPickticketsSuccess) {
      return {
        success: false,
        error: ['Failed to get bleckmann picktickets'],
      };
    }

    // Find the order with the max creationDateTime (parse as date for comparison)
    const lastBleckmannOrder = bleckmannPicktickets.reduce((last, curr) => {
      if (!last) return curr;
      const lastDate = new Date(last.creationDateTime);
      const currDate = new Date(curr.creationDateTime);
      return currDate > lastDate ? curr : last;
    }, null);
    if (!lastBleckmannOrder) {
      return {
        success: false,
        error: ['Error finding last bleckmann order'],
      };
    }
    const { reference: bleckmannOrderReference } = lastBleckmannOrder;

    // Fetch the Shopify order
    const shopifyOrderResponse = await shopifyOrderGet(region, { orderId: bleckmannOrderReference }, { attrs: 'id name createdAt' });
    const { success: shopifyOrderSuccess, result: shopifyOrder } = shopifyOrderResponse;
    if (!shopifyOrderSuccess) {
      return {
        success: false,
        error: ['Failed to get last Shopify order in Bleckmann'],
      };
    }

    // Get the order details and format them for output
    const { id: shopifyOrderId, name: shopifyOrderName, createdAt: shopifyOrderCreatedAt } = shopifyOrder;

    // Fetch the Shopify orders that have been fulfilled
    const shopifyRecentFulfilledOrdersResponse = await shopifyFetchLastFulfilledOrder(region);
    const { success: shopifyRecentFulfilledOrdersSuccess, result: shopifyRecentFulfilledOrders } = shopifyRecentFulfilledOrdersResponse;
    if (!shopifyRecentFulfilledOrdersSuccess) {
      return {
        success: false,
        error: ['Failed to get recent fulfilled Shopify orders'],
      };
    }

    // Find the last fulfilled order that has a shipping method metafield
    const shopifyLastFulfilledOrder = shopifyRecentFulfilledOrders.find(order => order.metafield?.value !== null);
    if (!shopifyLastFulfilledOrder) {
      return {
        success: false,
        error: [`No orders fulfilled in the last hour ${ region.toUpperCase() }`],
      };
    }

    const {
      id: shopifyLastFulfilledOrderId,
      name: shopifyLastFulfilledOrderName,
      createdAt: shopifyLastFulfilledOrderCreatedAt,
      processedAt: shopifyLastFulfilledOrderProcessedAt,
    } = shopifyLastFulfilledOrder;

    return {
      success: true,
      result: {
        lastNewOrder: {
          name: shopifyOrderName,
          id: shopifyOrderId,
          link: `https://admin.shopify.com/store/${ regionToShopifyStore[region] }/orders/${ gidToId(shopifyOrderId) }`,
          createdAtString: formatDateTimeString(shopifyOrderCreatedAt),
        },
        lastFulfilledOrder: {
          name: shopifyLastFulfilledOrderName,
          id: gidToId(shopifyLastFulfilledOrderId),
          link: `https://admin.shopify.com/store/${ regionToShopifyStore[region] }/orders/${ gidToId(shopifyLastFulfilledOrderId) }`,
          createdAtString: formatDateTimeString(shopifyLastFulfilledOrderCreatedAt),
          processedAtString: formatDateTimeString(shopifyLastFulfilledOrderProcessedAt),
        },
      },
    };
  }

  return {
    success: true,
    result: {},
  };
};

const collabsOrderSyncCheckApi = funcApi(collabsOrderSyncCheck, {
  requireHostedApiKey: true,
  argNames: ['region', 'options'],
  validatorsByArg: {
    region: Boolean,
  },
});

module.exports = {
  collabsOrderSyncCheck,
  collabsOrderSyncCheckApi,
};

// curl localhost:8000/collabsOrderSyncCheck -H "Content-Type: application/json" -d '{ "region": "au" }'
// curl localhost:8000/collabsOrderSyncCheck -H "Content-Type: application/json" -d '{ "region": "us" }'
// curl localhost:8000/collabsOrderSyncCheck -H "Content-Type: application/json" -d '{ "region": "uk" }'