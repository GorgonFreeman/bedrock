// Tag Shopify orders as having synced to their respective platforms, to exclude from future reviews.

const { respond, mandateParam, logDeep, askQuestion, dateTimeFromNow, days, arrayUnique } = require('../utils');
const {
  REGIONS_PVX,
  REGIONS_BLUEYONDER,
  REGIONS_LOGIWA,
} = require('../constants');

const { logiwaOrdersGet } = require('../logiwa/logiwaOrdersGet');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { shopifyTagsAdd } = require('../shopify/shopifyTagsAdd');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');

const collabsOrderSyncMark = async (
  region,
  {
    option,
  } = {},
) => {

  let markOrderIds = [];
  let markOrderGids = [];
  let markOrderNames = [];
  
  const pvxRelevant = REGIONS_PVX.includes(region);
  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  
  const anyRelevant = [pvxRelevant, logiwaRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }

  if (pvxRelevant) {
    // Get report of orders from PVX
    // TODO: Custom report from API options that differentiates between stores
    const pvxOrdersResponse = await peoplevoxReportGet('Orders Last 2 Days');
    const { success: pvxReportSuccess, result: pvxReportOrders } = pvxOrdersResponse;

    if (!pvxReportSuccess) {
      return pvxOrdersResponse;
    }

    const pvxOrderIds = pvxReportOrders.map(o => o['Sales order no.']);
    markOrderIds.push(...pvxOrderIds);
  }

  if (logiwaRelevant) {
    const logiwaSyncedOrdersResponse = await logiwaOrdersGet({
      shipmentOrderDate_bt: `${ dateTimeFromNow({ minus: days(2) }) },${ dateTimeFromNow() }`,
      // limit: 1000,
    });

    const { success: logiwaSyncedOrdersSuccess, result: logiwaSyncedOrders } = logiwaSyncedOrdersResponse;

    if (!logiwaSyncedOrdersSuccess) {
      return logiwaSyncedOrdersResponse;
    }

    const logiwaSyncedOrderCodes = logiwaSyncedOrders.map(order => order?.code).filter(code => code);

    markOrderNames.push(...logiwaSyncedOrderCodes);
  }

  console.log(markOrderNames.length);
  console.log(markOrderIds.length);
  console.log(markOrderGids.length);

  if (markOrderNames?.length) {
    const shopifyNamedOrdersResponse = await shopifyOrderGet(
      region, 
      markOrderNames.map(orderName => ({
        orderName,
      })), 
      {
        queueRunOptions: {
          interval: 20,
        },
      },
    );

    if (!shopifyNamedOrdersResponse.success) {
      return shopifyNamedOrdersResponse;
    }

    const shopifyNamedOrderGids = shopifyNamedOrdersResponse.result.map(order => order.id);
    markOrderGids.push(...shopifyNamedOrderGids);
  }

  if (markOrderIds?.length) {
    markOrderIds = arrayUnique(markOrderIds);
    markOrderGids.push(...markOrderIds.filter(Boolean).map(id => `gid://shopify/Order/${ id }`));
  }
  
  markOrderGids = arrayUnique(markOrderGids);
  console.log(markOrderGids.length);

  const response = await shopifyTagsAdd(
    region,
    markOrderGids,
    ['sync_confirmed'],
    {
      queueRunOptions: {
        interval: 20,
      },
    },
  );
  logDeep(response);
  return response;
};

const collabsOrderSyncMarkApi = async (req, res) => {
  const { 
    region,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'region', region),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await collabsOrderSyncMark(
    region,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsOrderSyncMark,
  collabsOrderSyncMarkApi,
};

// curl localhost:8000/collabsOrderSyncMark -H "Content-Type: application/json" -d '{ "region": "au" }'