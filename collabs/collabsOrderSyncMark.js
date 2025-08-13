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
  
  const pvxRelevant = REGIONS_PVX.includes(region);
  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  
  const anyRelevant = [pvxRelevant, logiwaRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }

  if (logiwaRelevant) {
    const logiwaSyncedOrdersResponse = await logiwaOrdersList({
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
    markOrderGids.push(...markOrderIds.map(id => `gid://shopify/Order/${ id }`));
  }

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

// curl localhost:8000/collabsOrderSyncMark -H "Content-Type: application/json" -d '{ "region": "us" }'