const { respond, mandateParam, gidToId, askQuestion, logDeep } = require('../utils');
const { 
  REGIONS_PVX, 
  REGIONS_BLUEYONDER,
  REGIONS_LOGIWA,
} = require('../constants');

const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');
const { peoplevoxOrdersGetById } = require('../peoplevox/peoplevoxOrdersGetById');

const collabsOrderSyncReview = async (
  region,
  {
    option,
  } = {},
) => {

  const shopifyOrdersResponse = await shopifyOrdersGet(
    region, 
    {
      attrs: `
        id
      `,
      queries: [
        'created_at:>2025-07-01',
        'fulfillment_status:unshipped',
        'status:open',
        'delivery_method:shipping',
      ],
      limit: 5000, // TODO: Remove after testing
    },
  );

  const { success: shopifyOrdersSuccess, result: shopifyOrders } = shopifyOrdersResponse;

  if (!shopifyOrdersSuccess) {
    return shopifyOrdersResponse;
  }

  const shopifyOrderIds = new Set(shopifyOrders.map(order => gidToId(order.id)));

  const pvxRelevant = REGIONS_PVX.includes(region);

  if (!pvxRelevant) {
    return { 
      success: false,
      error: ['No platform finder relevant to this region'],
    };
  }

  const foundIds = new Set();

  if (pvxRelevant) {
    const pvxOrdersResponse = await peoplevoxOrdersGetById(Array.from(shopifyOrderIds));
    logDeep('pvxOrdersResponse', pvxOrdersResponse);
    await askQuestion('Continue?');

    const { success: pvxOrdersSuccess, result: pvxOrders } = pvxOrdersResponse;
    logDeep('pvxOrders', pvxOrders);
    await askQuestion('Continue?');

    if (!pvxOrdersSuccess) {
      return pvxOrdersResponse;
    }

    const pvxOrderIds = pvxOrders.map(order => order?.SalesOrderNumber).filter(id => id);
    logDeep('pvxOrderIds', pvxOrderIds);
    await askQuestion('Continue?');
    
    foundIds.add(...pvxOrderIds);
  }

  const missingIds = new Set([...shopifyOrderIds].filter(id => !foundIds.has(id)));

  logDeep(missingIds);
  console.log(`found ${ foundIds.size } / ${ shopifyOrderIds.size }, missing ${ missingIds.size }`);
  await askQuestion('Continue?');

  return { 
    success: true,
    result: foundIds,
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