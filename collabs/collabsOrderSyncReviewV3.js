const { funcApi, surveyNestedArrays, logDeep, askQuestion } = require('../utils');

const { shopifyBulkOperationDo } = require('../shopify/shopifyBulkOperationDo');

const collabsOrderSyncReviewV3 = async (
  region,
  {
    option,
  } = {},
) => {

  const piles = {};

  const shopifyQueriesByRegion = {
    au: [
      `tag_not:'Sync:Confirmed'`,
    ],
    us: [
      `tag:'sync-to-radial'`,
    ],
  };

  const shopifyQueries = [
    'created_at:>2025-07-01',
    '(fulfillment_status:unshipped OR fulfillment_status:partial)',
    'status:open',
    'delivery_method:shipping',
    `tag_not:'order_sync_review_exclude'`,
    `tag_not:'sync_confirmed'`,
    ...(shopifyQueriesByRegion?.[region] || []),
  ];

  const shopifyOrdersQuery = `{
    orders(query: "${ shopifyQueries.join(' AND ') }", sortKey: CREATED_AT) {
      edges {
        node {
          id
          name
          createdAt
        }
      }
    }
  }`;

  const shopifyOrdersResponse = await shopifyBulkOperationDo(
    region,
    'query',
    shopifyOrdersQuery,
  );
  const { success: shopifyOrdersSuccess, result: shopifyOrders } = shopifyOrdersResponse;
  if (!shopifyOrdersSuccess) {
    return shopifyOrdersResponse;
  }

  piles.in = shopifyOrders;

  const oldestDate = shopifyOrders?.[0]?.createdAt;
  logDeep({
    oldestDate,
  });
  await askQuestion('?');

  console.log(surveyNestedArrays(piles));

  return { 
    success: true,
    result: piles,
  };
  
};

const collabsOrderSyncReviewV3Api = funcApi(collabsOrderSyncReviewV3, {
  argNames: ['region', 'options'],
});

module.exports = {
  collabsOrderSyncReviewV3,
  collabsOrderSyncReviewV3Api,
};

// curl localhost:8000/collabsOrderSyncReviewV3 -H "Content-Type: application/json" -d '{ "region": "us" }'