// https://shopify.dev/docs/api/admin-graphql/unstable/mutations/fulfillmentOrderSubmitFulfillmentRequest

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id requestStatus`;

const shopifyFulfillmentOrderSubmitFulfillmentRequest = async (
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