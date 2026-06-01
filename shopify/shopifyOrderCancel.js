// https://shopify.dev/docs/api/admin-graphql/latest/mutations/ordercancel

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id name createdAt customer { email } cancelledAt`;

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
      refundMethod: {
        type: 'OrderCancelRefundMethodInput!',
        value: refundMethod,
      },
      restock: {
        type: 'Boolean!',
        value: restock,
      },
      staffNote: {
        type: 'String!',
        value: staffNote,
      },
    },
    `order { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyOrderCancelApi = funcApi(shopifyOrderCancel, {
  argNames: [
    'credsPath', 
    'orderId', 
    'options'
  ],
  validatorsByArg: {
    credsPath: Boolean,
    orderId: Boolean,
  },
});

module.exports = {
  shopifyOrderCancel,
  shopifyOrderCancelApi,
};

// curl http://localhost:8000/shopifyOrderCancel -H 'Content-Type: application/json' -d '{ "credsPath": "us", "orderId": "1797615550524", "options": { "restock": false } }'