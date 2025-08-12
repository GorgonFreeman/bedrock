const { respond, mandateParam } = require('../utils');
const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');

const collabsOrderSyncReview = async (
  region,
  {
    option,
  } = {},
) => {

  const shopifyOrders = await shopifyOrdersGet(
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