// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fulfillmentOrderCancel

const { funcApi, gidToId, logDeep, askQuestion, actionMultipleOrSingle } = require('../utils');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { shopifyFuflillmentOrderCancel } = require('../shopify/shopifyFuflillmentOrderCancel');

const FULFILLMENT_ORDERS_FETCHED = 50;

const EXCLUDED_STATUSES = ['CANCELLED', 'CLOSED'];

const defaultReturnAttrs = `fulfillmentOrder { status requestStatus } replacementFulfillmentOrder { status requestStatus }`;

const fulfillmentOrdersAttrs = `
  id
  status
  requestStatus
`;

const orderAttrs = `
  id
  fulfillmentOrders (first: ${ FULFILLMENT_ORDERS_FETCHED }) {
    edges {
      node {
        ${ fulfillmentOrdersAttrs }
      }
    }
  }
`;

const shopifyOrderFulfillmentOrdersCancelSingle = async (
  credsPath,
  orderId,
  {
    apiVersion,
    returnAttrs = defaultReturnAttrs,
  } = {},
) => {

  const orderResponse = await shopifyOrderGet(
    credsPath,
    { orderId },
    {
      apiVersion,
      attrs: orderAttrs,
    },
  );

  const { success: orderSuccess, result: order } = orderResponse;

  if (!orderSuccess) {
    return orderResponse;
  }

  const { fulfillmentOrders } = order;

  if (fulfillmentOrders.length >= FULFILLMENT_ORDERS_FETCHED) {
    return {
      success: false,
      errors: [`Order could have more than one page of fulfillment orders. Please check manually.`],
    };
  }

  const fulfillmentOrdersToCancel = fulfillmentOrders.filter(
    fo => !EXCLUDED_STATUSES.includes(fo.status),
  );

  if (!fulfillmentOrdersToCancel.length) {
    return {
      success: true,
      result: [],
      code: 204,
    };
  }

  const fulfillmentOrderIds = fulfillmentOrdersToCancel.map(fo => gidToId(fo.id));

  logDeep(`Cancelling fulfillment orders for ${ credsPath }:${ orderId }`, {
    fulfillmentOrdersToCancel: fulfillmentOrdersToCancel.map(fo => ({
      id: gidToId(fo.id),
      status: fo.status,
      requestStatus: fo.requestStatus,
    })),
  });
  await askQuestion('?');

  const cancelResponse = await shopifyFuflillmentOrderCancel(
    credsPath,
    fulfillmentOrderIds,
    {
      apiVersion,
      returnAttrs,
    },
  );

  return cancelResponse;
};

const shopifyOrderFulfillmentOrdersCancel = async (
  credsPath,
  orderId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    orderId,
    shopifyOrderFulfillmentOrdersCancelSingle,
    (orderId) => ({
      args: [credsPath, orderId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  return response;
};

const shopifyOrderFulfillmentOrdersCancelApi = funcApi(shopifyOrderFulfillmentOrdersCancel, {
  argNames: ['credsPath', 'orderId', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    orderId: (p) => {
      if (Array.isArray(p)) {
        return p.length > 0 && p.every(Boolean);
      }
      return Boolean(p);
    },
  },
});

module.exports = {
  shopifyOrderFulfillmentOrdersCancel,
  shopifyOrderFulfillmentOrdersCancelSingle,
  shopifyOrderFulfillmentOrdersCancelApi,
};

// curl http://localhost:8000/shopifyOrderFulfillmentOrdersCancel -H 'Content-Type: application/json' -d '{ "credsPath": "au", "orderId": "1234567890" }'
