// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fulfillmentOrderCancel

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `fulfillmentOrder { status requestStatus } replacementFulfillmentOrder { status requestStatus }`;

const shopifyFuflillmentOrderCancelSingle = async (
  credsPath,
  fulfillmentOrderId,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'fulfillmentOrderCancel',
    {
      id: {
        type: 'ID!',
        value: `gid://shopify/FulfillmentOrder/${ fulfillmentOrderId }`,
      },
    },
    returnAttrs,
    { 
      apiVersion,
    },
  );
  return response;
};

const shopifyFuflillmentOrderCancel = async (
  credsPath,
  fulfillmentOrderId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    fulfillmentOrderId,
    shopifyFuflillmentOrderCancelSingle,
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

const shopifyFuflillmentOrderCancelApi = funcApi(shopifyFuflillmentOrderCancel, {
  argNames: ['credsPath', 'fulfillmentOrderId', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    fulfillmentOrderId: Boolean,
  },
});

module.exports = {
  shopifyFuflillmentOrderCancel,
  shopifyFuflillmentOrderCancelApi,
};

// curl http://localhost:8000/shopifyFuflillmentOrderCancel -H 'Content-Type: application/json' -d '{ "credsPath": "au", "fulfillmentOrderId": "12341234" }'