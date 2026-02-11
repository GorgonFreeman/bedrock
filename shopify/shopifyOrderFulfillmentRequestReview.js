// Checks if any fulfillment requests are pending a response from the fulfillment service.
// This is essentially an order sync check, for a store where the fulfillment service is not Shopify.

const { funcApi, logDeep } = require('../utils');
const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');

const attrs = `
  id
  name
  fulfillmentOrders (query: "request_status:SUBMITTED", first: 1) {
    edges {
      node {
        id
      }
    }
  }
`;

const shopifyOrderFulfillmentRequestReview = async (
  region,
  {
    ignoreWindowMinutes = 0,
  } = {},
) => {

  const ordersResponse = await shopifyOrdersGet(
    region,
    {
      queries: [
        'created_at:>2025-07-01',
        '(fulfillment_status:unshipped OR fulfillment_status:partial)',
        'status:open',
        'delivery_method:shipping',
        'tag_not:fulfillment_request_review_exclude',
        'tag_not:fulfillment_request_answered',
      ],
      attrs,
    },
  );

  if (!ordersResponse?.success) {
    return ordersResponse;
  }

  const orders = ordersResponse.result || [];
  const requestSubmittedOrders = orders.filter(
    (o) => (o.fulfillmentOrders?.length ?? 0) > 0,
  );
  const submittedCount = requestSubmittedOrders.length;

  const response = {
    success: true,
    result: {
      metadata: {
        submittedCount,
      },
      samples: {
        submitted: requestSubmittedOrders.slice(0, 10),
      },
      piles: {
        requestSubmittedOrders,
      },
    },
  };

  logDeep('response', response);
  return response;
};

const shopifyOrderFulfillmentRequestReviewApi = funcApi(shopifyOrderFulfillmentRequestReview, {
  argNames: ['region', 'options'],
  validatorsByArg: {
    region: Boolean,
  },
});

module.exports = {
  shopifyOrderFulfillmentRequestReview,
  shopifyOrderFulfillmentRequestReviewApi,
};

// curl localhost:8000/shopifyOrderFulfillmentRequestReview -H "Content-Type: application/json" -d '{ "region": "uk" }'