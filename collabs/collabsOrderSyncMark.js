const { respond, mandateParam, logDeep, askQuestion, dateTimeFromNow, days } = require('../utils');
const {
  REGIONS_PVX,
  REGIONS_BLUEYONDER,
  REGIONS_LOGIWA,
} = require('../constants');

const { logiwaOrdersList } = require('../logiwa/logiwaOrdersList');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { shopifyTagsAdd } = require('../shopify/shopifyTagsAdd');

const collabsOrderSyncMark = async (
  region,
  {
    option,
  } = {},
) => {

  const markOrderIds = [];
  const markOrderGids = [];
  const markOrderNames = [];

  const logiwaRelevant = REGIONS_LOGIWA.includes(region);

  if (logiwaRelevant) {
    const logiwaSyncedOrdersResponse = await logiwaOrdersList({
      shipmentOrderDate_bt: `${ dateTimeFromNow({ minus: days(2) }) },${ dateTimeFromNow() }`,
    });
    logDeep(logiwaSyncedOrdersResponse);
    await askQuestion('?');

    const { success: logiwaSyncedOrdersSuccess, result: logiwaSyncedOrders } = logiwaSyncedOrdersResponse;

    if (!logiwaSyncedOrdersSuccess) {
      return logiwaSyncedOrdersResponse;
    }

    logDeep(logiwaSyncedOrders);
    await askQuestion('?');

    const logiwaSyncedOrderCodes = logiwaSyncedOrders.map(order => order?.code).filter(code => code);
    logDeep(logiwaSyncedOrderCodes);
    await askQuestion('?');

    markOrderNames.push(...logiwaSyncedOrderCodes);
  }

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
    markOrderGids.push(...markOrderIds.map(id => `gid://shopify/Order/${ id }`));
  }

  const response = await shopifyTagsAdd(
    region,
    markOrderGids,
    ['sync_confirmed'],
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

// curl localhost:8000/collabsOrderSyncMark -H "Content-Type: application/json" -d '{ "region": "us" }'