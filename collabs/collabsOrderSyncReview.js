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
      limit: 50, // TODO: Remove after testing
    },
  );

  const { success: shopifyOrdersSuccess, result: shopifyOrders } = shopifyOrdersResponse;

  if (!shopifyOrdersSuccess) {
    return shopifyOrdersResponse;
  }

  const shopifyOrderIds = shopifyOrders.map(order => gidToId(order.id));

  const pvxRelevant = REGIONS_PVX.includes(region);
  const bleckmannRelevant = REGIONS_BLUEYONDER.includes(region);
  const logiwaRelevant = REGIONS_LOGIWA.includes(region);

  if (pvxRelevant) {
    const pvxOrders = await peoplevoxOrdersGetById(shopifyOrders.filter(order => gidToId(order.id)));

    logDeep(pvxOrders);
    await askQuestion('Continue?');
  }

  return { 
    success: true,
    result: shopifyOrders,
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