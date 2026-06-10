const { funcApi, logDeep, days, dateTimeFromNow } = require('../utils');
const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');

const attrs = `
  id
  name
  createdAt
`;

const collabsOrderFulfillmentReview = async (
  store,
  {
    olderThanDays = 7,
  } = {},
) => {

  const createdBefore = dateTimeFromNow({ minus: days(olderThanDays), dateOnly: true });

  const ordersResponse = await shopifyOrdersGet(
    store,
    {
      queries: [
        'created_at:>2025-09-30',
        `created_at:<${ createdBefore }`,
        '-fulfillment_status:fulfilled',
        'status:open',
        'delivery_method:shipping',
        'tag_not:fulfillment_review_exclude',
      ],
      attrs,
      sortKey: 'CREATED_AT',
      reverse: false,
    },
  );

  if (!ordersResponse?.success) {
    return ordersResponse;
  }

  const staleOrders = ordersResponse.result || [];

  const response = {
    success: true,
    result: {
      metadata: {
        staleCount: staleOrders.length,
        createdBefore,
      },
      samples: {
        stale: staleOrders.slice(0, 10),
      },
      piles: {
        staleOrders,
      },
    },
  };

  logDeep('response', response);
  return response;

};

const collabsOrderFulfillmentReviewApi = funcApi(collabsOrderFulfillmentReview, {
  argNames: ['store', 'options'],
  validatorsByArg: {
    store: Boolean,
  },
});

module.exports = {
  collabsOrderFulfillmentReview,
  collabsOrderFulfillmentReviewApi,
};

// curl localhost:8000/collabsOrderFulfillmentReview -H "Content-Type: application/json" -d '{ "store": "au" }'
// curl localhost:8000/collabsOrderFulfillmentReview -H "Content-Type: application/json" -d '{ "store": "uk", "options": { "olderThanDays": 30 } }'
