// https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/fulfillmentOrderSubmitCancellationRequest

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `status requestStatus`;

const shopifyFulfillmentOrderSubmitCancellationRequest = async (
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
  logDeep(response);
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