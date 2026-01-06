// https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/fulfillmentOrderSubmitCancellationRequest

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `status requestStatus`;

const shopifyFulfillmentOrderSubmitCancellationRequestSingle = async (
  credsPath,
  fulfillmentOrderId,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
    message,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'fulfillmentOrderSubmitCancellationRequest',
    {
      id: {
        type: 'ID!',
        value: `gid://shopify/FulfillmentOrder/${ fulfillmentOrderId }`,
      },
      ...message && {
        message: {
          type: 'String',
          value: message,
        },
      },
    },
    `fulfillmentOrder { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  return response;
};

const shopifyFulfillmentOrderSubmitCancellationRequest = async (
  credsPath,
  fulfillmentOrderId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    fulfillmentOrderId,
    shopifyFulfillmentOrderSubmitCancellationRequestSingle,
    (fulfillmentOrderId) => ({
      args: [credsPath, fulfillmentOrderId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  return response;
};

const shopifyFulfillmentOrderSubmitCancellationRequestApi = funcApi(shopifyFulfillmentOrderSubmitCancellationRequest, {
  argNames: ['credsPath', 'fulfillmentOrderId', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    fulfillmentOrderId: Boolean,
  },
});

module.exports = {
  shopifyFulfillmentOrderSubmitCancellationRequest,
  shopifyFulfillmentOrderSubmitCancellationRequestApi,
};

// curl http://localhost:8000/shopifyFulfillmentOrderSubmitCancellationRequest -H 'Content-Type: application/json' -d '{ "credsPath": "au", "fulfillmentOrderId": "12341234" }'