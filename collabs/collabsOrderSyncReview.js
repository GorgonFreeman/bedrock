const { respond, mandateParam, gidToId, askQuestion, logDeep, readableTimeFromMs } = require('../utils');
const { 
  REGIONS_PVX, 
  REGIONS_BLUEYONDER,
  REGIONS_LOGIWA,
} = require('../constants');

const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');
const { peoplevoxOrdersGetById } = require('../peoplevox/peoplevoxOrdersGetById');

const { logiwaStatusToStatusId } = require('../logiwa/logiwa.utils');
const { logiwaOrdersList } = require('../logiwa/logiwaOrdersList');
const { logiwaOrderGet } = require('../logiwa/logiwaOrderGet');

const collabsOrderSyncReview = async (
  region,
  {
    option,
  } = {},
) => {

  const regionQueries = {
    au: [
      `tag_not:'Sync:Confirmed'`,
    ],
    us: [
      `tag:'sync-to-radial'`,
    ],
  }

  const shopifyOrdersResponse = await shopifyOrdersGet(
    region, 
    {
      attrs: `
        id
        name
        createdAt
      `,
      queries: [
        'created_at:>2025-07-01',
        'fulfillment_status:unshipped',
        'status:open',
        'delivery_method:shipping',
        ...(regionQueries?.[region] || []),
      ],
      // limit: 1000, // TODO: Remove after testing
    },
  );

  const { success: shopifyOrdersSuccess, result: shopifyOrders } = shopifyOrdersResponse;

  if (!shopifyOrdersSuccess) {
    return shopifyOrdersResponse;
  }

  const shopifyOrderIds = shopifyOrders.map(order => gidToId(order.id));

  const pvxRelevant = REGIONS_PVX.includes(region);
  const logiwaRelevant = REGIONS_LOGIWA.includes(region);

  if (!(pvxRelevant || logiwaRelevant)) {
    return { 
      success: false,
      error: ['No platform finder relevant to this region'],
    };
  }

  const foundIds = [];

  if (pvxRelevant) {
    const pvxOrdersResponse = await peoplevoxOrdersGetById(shopifyOrderIds);

    const { success: pvxOrdersSuccess, result: pvxOrders } = pvxOrdersResponse;

    if (!pvxOrdersSuccess) {
      return pvxOrdersResponse;
    }

    const pvxOrderIds = pvxOrders.map(order => order?.SalesOrderNumber).filter(id => id);
    
    foundIds.push(...pvxOrderIds);
  } else if (logiwaRelevant) {

    let findOrders = [...shopifyOrders];

    const logiwaPrefetchedOrdersResponse = await logiwaOrdersList({
      status_eq: logiwaStatusToStatusId('Open'),
    });
    const { result: logiwaPrefetchedOrders = [] } = logiwaPrefetchedOrdersResponse;
    const logiwaPrefetchedOrderCodes = logiwaPrefetchedOrders.map(order => order?.code).filter(code => code);

    const orderSet = new Set(logiwaPrefetchedOrderCodes);
    findOrders = findOrders.filter(o => !orderSet.has(o.name));

    const logiwaOrdersResponse = await logiwaOrderGet(findOrders.map(o => ({ orderCode: o.name })), {
      queueRunOptions: {
        interval: 20,
      },
    });
    // Success may be false due to the presence of unfound orders
    // TODO: Consider interpreting this as a success in the future, inside logiwaOrderGet. It seems right to say the call was successful, but the order was not found.
    const { result: logiwaOrders = [] } = logiwaOrdersResponse;

    const logiwaOrderCodes = logiwaOrders.map(order => order?.code).filter(code => code);
    const logiwaOrderCodesSet = new Set(logiwaOrderCodes);
    findOrders = findOrders.filter(o => !logiwaOrderCodesSet.has(o.name));

    const impliedFoundIds = shopifyOrders.filter(order => !findOrders.find(o => o.id === order.id)).map(o => gidToId(o.id));
    foundIds.push(...impliedFoundIds);
  }

  const missingIds = shopifyOrderIds.filter(id => !foundIds.includes(id));
  logDeep(missingIds);

  const missingOrders = shopifyOrders.filter(order => missingIds.includes(gidToId(order.id)));

  console.log(region, `found ${ foundIds.length } / ${ shopifyOrderIds.length }, missing ${ missingIds.length }`);

  const oldestUnsyncedOrder = missingOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))?.[0];
  const maxDelay = oldestUnsyncedOrder ? new Date() - new Date(oldestUnsyncedOrder?.createdAt) : 0;

  return { 
    success: true,
    result: {
      missing: missingIds,
      found: foundIds,
      total: shopifyOrderIds.length,
      delay: readableTimeFromMs(maxDelay),
    },
  };
  
};

const collabsOrderSyncReviewApi = async (req, res) => {
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

  const result = await collabsOrderSyncReview(
    region,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsOrderSyncReview,
  collabsOrderSyncReviewApi,
};

// curl localhost:8000/collabsOrderSyncReview -H "Content-Type: application/json" -d '{ "region": "au" }'