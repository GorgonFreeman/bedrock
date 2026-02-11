// Checks if any fulfillment requests are pending a response from the fulfillment service.
// This is essentially an order sync check, for a store where the fulfillment service is not Shopify.

const { funcApi, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyOrderFulfillmentRequestReview = async (
  region,
  {
    ignoreWindowMinutes = 0,
  } = {},
) => {

  /*
    Fetch all orders from Shopify that are:
    'created_at:>2025-07-01',
    '(fulfillment_status:unshipped OR fulfillment_status:partial)',
    'status:open',
    'delivery_method:shipping',
    `tag_not:'fulfillment_request_review_exclude'`,
    not tagged 'fulfillment_request_answered'
  */

  // If not success, return ordersResponse

  // Find any fulfillment orders with request status 'SUBMITTED'

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

  logDeep(response);
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