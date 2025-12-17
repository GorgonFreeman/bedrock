// Check the latest WMS orders to establish how far behind the sync is

const { funcApi, gidToId, askQuestion, logDeep } = require('../utils');
const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');

const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');

const { bleckmannPickticketsGetter } = require('../bleckmann/bleckmannPickticketsGet');

const { logiwaOrdersGetter } = require('../logiwa/logiwaOrdersGet');

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
    
    // Get the latest sales order number
    const latestSalesOrder = pvxOrders[pvxOrders.length - 1];

    // Fetch the Shopify order
    const shopifyOrdersResponse = await shopifyOrderGet(region, { orderId: latestSalesOrder['Sales order no.']}, { attrs: 'id name createdAt' });
    const { success: shopifyOrdersSuccess, result: shopifyOrder } = shopifyOrdersResponse;
    if (!shopifyOrdersSuccess) {
      return {
        success: false,
        error: ['Failed to get latest Shopify order in PVX'],
      };
    }

    const { id: shopifyOrderId, name: shopifyOrderName, createdAt: shopifyOrderCreatedAt } = shopifyOrder;
    const orderDateTimeString = `${ new Date(shopifyOrderCreatedAt) }`;

    return {
      success: true,
      result: {
        latestNewOrder: {
          name: shopifyOrderName,
          id: shopifyOrderId,
          link: `https://admin.shopify.com/store/${ regionToShopifyStore[region] }/orders/${ shopifyOrderId }`,
          createdAtString: orderDateTimeString,
        },
      },
    };
  }

  if (logiwaRelevant) {
  }

  if (bleckmannRelevant) {
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