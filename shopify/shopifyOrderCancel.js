// https://shopify.dev/docs/api/admin-graphql/latest/mutations/ordercancel

const { funcApi, customNullish, actionMultipleOrSingle } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `job { id done }`;

const shopifyOrderCancelSingle = async (
  credsPath,
  orderId,
  {
    apiVersion,
    returnAttrs = defaultAttrs,

    reason = 'OTHER',
    refundMethod,
    restock = true,
    staffNote,
    notifyCustomer = false,

  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'orderCancel',
    {
      notifyCustomer: {
        type: 'Boolean!',
        value: notifyCustomer,
      },
      orderId: {
        type: 'ID!',
        value: `gid://shopify/Order/${ orderId }`,
      },
      reason: {
        type: 'OrderCancelReason!',
        value: reason,
      },
      ...!customNullish(refundMethod) && {
        refundMethod: {
          type: 'OrderCancelRefundMethodInput!',
          value: refundMethod,
        },
      },
      restock: {
        type: 'Boolean!',
        value: restock,
      },
      ...!customNullish(staffNote) && {
        staffNote: {
          type: 'String!',
          value: staffNote,
        },
      },
    },
    returnAttrs,
    { 
      apiVersion,
    },
  );

  return response;
};

const shopifyOrderCancel = async (
  credsPath,
  orderId,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
    reason = 'OTHER',
    refundMethod,
    restock = true,
    staffNote,
    notifyCustomer = false,
    queueRunOptions,
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    orderId,
    shopifyOrderCancelSingle,
    (orderId) => ({
      args: [credsPath, orderId],
      options: {
        apiVersion,
        returnAttrs,
        reason,
        refundMethod,
        restock,
        staffNote,
        notifyCustomer,
      },
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  return response;
};

const shopifyOrderCancelApi = funcApi(shopifyOrderCancel, {
  argNames: [
    'credsPath', 
    'orderId', 
    'options',
  ],
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
  shopifyOrderCancel,
  shopifyOrderCancelSingle,
  shopifyOrderCancelApi,
};

// curl http://localhost:8000/shopifyOrderCancel -H 'Content-Type: application/json' -d '{ "credsPath": "us", "orderId": "1797615550524", "options": { "restock": false, "refundMethod": { "originalPaymentMethodsRefund": false } } }'
