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

  const shopifyOrderIds = shopifyOrders.map(order => gidToId(order.id));

  const pvxRelevant = REGIONS_PVX.includes(region);

  if (!pvxRelevant) {
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
  }

  const missingIds = shopifyOrderIds.filter(id => !foundIds.includes(id));

  logDeep(missingIds);
  console.log(region, `found ${ foundIds.size } / ${ shopifyOrderIds.length }, missing ${ missingIds.length }`);

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