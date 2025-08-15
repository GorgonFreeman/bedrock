// Check if Shopify orders are present in their respective platforms to establish whether the sync is working.

const { respond, mandateParam, gidToId, askQuestion, logDeep, readableTimeFromMs, valueExcludingOutliers, dateTimeFromNow, days, arraySortByProp } = require('../utils');
const { 
  REGIONS_PVX, 
  REGIONS_BLECKMANN,
  REGIONS_LOGIWA,
} = require('../constants');

const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');
const { shopifyTagsAdd } = require('../shopify/shopifyTagsAdd');

const { peoplevoxOrdersGetById } = require('../peoplevox/peoplevoxOrdersGetById');

const { logiwaStatusToStatusId } = require('../logiwa/logiwa.utils');
const { logiwaOrdersGet } = require('../logiwa/logiwaOrdersGet');
const { logiwaOrderGet } = require('../logiwa/logiwaOrderGet');

const { bleckmannPickticketGet } = require('../bleckmann/bleckmannPickticketGet');
const { bleckmannPickticketsGet } = require('../bleckmann/bleckmannPickticketsGet');

const collabsOrderSyncReview = async (
  region,
  {
    markFound = false,
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
        `tag_not:'order_sync_review_exclude'`,
        `tag_not:'sync_confirmed'`,
        ...(regionQueries?.[region] || []),
      ],
      // limit: 1000,
    },
  );

  const { success: shopifyOrdersSuccess, result: shopifyOrders } = shopifyOrdersResponse;

  if (!shopifyOrdersSuccess) {
    return shopifyOrdersResponse;
  }

  const shopifyOrderIds = shopifyOrders.map(order => gidToId(order.id));
  const oldestShopifyOrderToFind = arraySortByProp(shopifyOrders, 'createdAt')?.[0];
  const oldestDate = oldestShopifyOrderToFind?.createdAt;

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
    
    const worthPrefetching = findOrders.length > 500;
    if (worthPrefetching) {

      const logiwaPrefetchedOrdersResponse = await logiwaOrdersGet({
        status_eq: logiwaStatusToStatusId('Open'),
      });
      const { result: logiwaPrefetchedOrders = [] } = logiwaPrefetchedOrdersResponse;
      const logiwaPrefetchedOrderCodes = logiwaPrefetchedOrders.map(order => order?.code).filter(code => code);

      const orderSet = new Set(logiwaPrefetchedOrderCodes);
      findOrders = findOrders.filter(o => !orderSet.has(o.name));
    }

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

  } else if (bleckmannRelevant) {

    let findOrders = [...shopifyOrders];
    console.log('findOrders', findOrders.length);

    const bleckmannOrdersResponse = await bleckmannPickticketsGet({
      createdFrom: oldestDate,
    });
    
    const {
      success: bleckmannOrdersSuccess,
      result: bleckmannOrders,
    } = bleckmannOrdersResponse;
    if (!bleckmannOrdersSuccess) {
      return bleckmannOrdersResponse;
    }
    
    const bleckmannPrefetchFoundIds = bleckmannOrders
      .map(order => order?.reference)
      .filter(Boolean)
      // Only record orders that we're actually looking for, to avoid reporting tagged orders as found
      .filter(id => findOrders.find(o => gidToId(o.id) === id)); 
    foundIds.push(...bleckmannPrefetchFoundIds);
    findOrders = findOrders.filter(o => !foundIds.includes(gidToId(o.id)));

    console.log('findOrders after prefetch', findOrders.length);
    
    /* Get orders individually - way too slow and API 429s quickly
    const bleckmannRemainingResponse = await bleckmannPickticketGet(
      findOrders.map(o => ({ pickticketReference: gidToId(o.id) })),
    );

    const {
      success: bleckmannRemainingSuccess,
      result: bleckmannRemainingOrders,
    } = bleckmannRemainingResponse;
    if (!bleckmannRemainingSuccess) {
      return bleckmannRemainingResponse;
    }

    const bleckmannRemainingOrderIds = bleckmannRemainingOrders.map(order => order?.reference).filter(Boolean);
    foundIds.push(...bleckmannRemainingOrderIds);
    findOrders = findOrders.filter(o => !bleckmannRemainingOrderIds.includes(gidToId(o.id)));

    console.log('findOrders after individual fetch', findOrders.length);
    */
  }

  const missingIds = shopifyOrderIds.filter(id => !foundIds.includes(id));
  logDeep(missingIds);

  const missingOrders = shopifyOrders.filter(order => missingIds.includes(gidToId(order.id)));

  console.log(region, `found ${ foundIds.length } / ${ shopifyOrderIds.length }, missing ${ missingIds.length }`);

  // const oldestUnsyncedOrder = missingOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))?.[0];
  // logDeep('oldestUnsyncedOrder', oldestUnsyncedOrder);
  // const maxDelay = oldestUnsyncedOrder ? new Date() - new Date(oldestUnsyncedOrder?.createdAt) : 0;

  let approxDelay = 0;
  
  if (missingOrders.length > 0) {
    const oldestMissingOrderDate = valueExcludingOutliers(missingOrders.map(order => new Date(order.createdAt)), { returnHighest: false, convertToDate: true });
    if (oldestMissingOrderDate) {
      approxDelay = new Date() - oldestMissingOrderDate;
    }
  }

  if (markFound) {
    const markResponse = await shopifyTagsAdd(
      region,
      foundIds.map(id => `gid://shopify/Order/${ id }`),
      ['sync_confirmed'],
      {
        queueRunOptions: {
          interval: 20,
        },
      },
    );
  }

  return { 
    success: true,
    result: {
      missing: missingIds.length,
      missingSample: missingIds.slice(0, 10),
      found: foundIds.length,
      foundSample: foundIds.slice(0, 10),
      total: shopifyOrderIds.length,
      delay: readableTimeFromMs(approxDelay),
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

// curl localhost:8000/collabsOrderSyncReview -H "Content-Type: application/json" -d '{ "region": "us" }'
// curl localhost:8000/collabsOrderSyncReview -H "Content-Type: application/json" -d '{ "region": "us", "options": { "markFound": true } }'