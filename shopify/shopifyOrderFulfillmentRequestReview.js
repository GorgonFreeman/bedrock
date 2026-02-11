// Checks if any fulfillment requests are pending a response from the fulfillment service.
// This is essentially an order sync check, for a store where the fulfillment service is not Shopify.

const { funcApi, logDeep, minutes } = require('../utils');
const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');
const { shopifyTagsAdd } = require('../shopify/shopifyTagsAdd');

const attrs = `
  id
  name
  createdAt
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
    addTags = false,
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
  const withSubmittedRequest = orders.filter(
    (o) => (o.fulfillmentOrders?.length ?? 0) > 0,
  );
  const withoutSubmittedRequest = orders.filter(
    (o) => (o.fulfillmentOrders?.length ?? 0) === 0,
  );

  let tagAddResult;
  if (addTags && withoutSubmittedRequest.length > 0) {
    const tagAddResponse = await shopifyTagsAdd(
      region,
      withoutSubmittedRequest.map((o) => o.id),
      ['fulfillment_request_answered'],
      { queueRunOptions: { interval: 20 } },
    );
    if (!tagAddResponse?.success) {
      return tagAddResponse;
    }
    tagAddResult = tagAddResponse.result;
  }

  let requestSubmittedOrders = withSubmittedRequest;
  const ignored = [];

  if (ignoreWindowMinutes > 0) {
    const now = new Date();
    const ignoreWindowMs = minutes(ignoreWindowMinutes);
    requestSubmittedOrders = withSubmittedRequest.filter((order) => {
      const age = now - new Date(order.createdAt);
      if (age < ignoreWindowMs) {
        ignored.push(order);
        return false;
      }
      return true;
    });
  }

  if (addTags && withoutSubmittedRequest.length > 0) {
    const taggedOrderIds = new Set(withoutSubmittedRequest.map((o) => o.id));
    requestSubmittedOrders = requestSubmittedOrders.filter(
      (o) => !taggedOrderIds.has(o.id),
    );
  }

  const submittedCount = requestSubmittedOrders.length;

  const response = {
    success: true,
    result: {
      metadata: {
        submittedCount,
        ...(ignoreWindowMinutes > 0 && { ignoredCount: ignored.length }),
        ...(addTags && withoutSubmittedRequest.length > 0 && {
          taggedCount: withoutSubmittedRequest.length,
        }),
      },
      samples: {
        submitted: requestSubmittedOrders.slice(0, 10),
      },
      piles: {
        requestSubmittedOrders,
        ignored,
        withoutSubmittedRequest,
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
// curl localhost:8000/shopifyOrderFulfillmentRequestReview -H "Content-Type: application/json" -d '{ "region": "uk", "options": { "ignoreWindowMinutes": 30 } }'
// curl localhost:8000/shopifyOrderFulfillmentRequestReview -H "Content-Type: application/json" -d '{ "region": "uk", "options": { "ignoreWindowMinutes": 30, "addTags": true } }'