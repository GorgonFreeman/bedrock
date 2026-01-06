// https://shopify.dev/docs/api/admin-graphql/unstable/mutations/fulfillmentOrderSubmitFulfillmentRequest

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id requestStatus`;

const shopifyFulfillmentOrderSubmitFulfillmentRequestSingle = async (
  credsPath,
  fulfillmentOrderId,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
    fulfillmentOrderLineItems,
    message,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'fulfillmentOrderSubmitFulfillmentRequest',
    {
      id: {
        type: 'ID!',
        value: `gid://shopify/FulfillmentOrder/${ fulfillmentOrderId }`,
      },
      ...fulfillmentOrderLineItems && {
        fulfillmentOrderLineItems: {
          type: '[FulfillmentOrderLineItemInput!]',
          value: fulfillmentOrderLineItems,
        },
      },
      ...message && {
        message: {
          type: 'String',
          value: message,
        },
      },
    },
    `submittedFulfillmentOrder { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  return response;
};

const shopifyFulfillmentOrderSubmitFulfillmentRequest = async (
  credsPath,
  fulfillmentOrderId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    fulfillmentOrderId,
    shopifyFulfillmentOrderSubmitFulfillmentRequestSingle,
    (fulfillmentOrderId) => ({
      args: [credsPath, fulfillmentOrderId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyFulfillmentOrderSubmitFulfillmentRequestApi = funcApi(shopifyFulfillmentOrderSubmitFulfillmentRequest, {
  argNames: ['credsPath', 'fulfillmentOrderId', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    fulfillmentOrderId: Boolean,
  },
});

module.exports = {
  shopifyFulfillmentOrderSubmitFulfillmentRequest,
  shopifyFulfillmentOrderSubmitFulfillmentRequestApi,
};

// curl http://localhost:8000/shopifyFulfillmentOrderSubmitFulfillmentRequest -H 'Content-Type: application/json' -d '{ "credsPath": "au", "fulfillmentOrderId": "12341234" }'