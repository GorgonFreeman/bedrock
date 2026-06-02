// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fulfillmentCancel

const { funcApi, actionMultipleOrSingle } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id status`;

const shopifyFulfillmentCancelSingle = async (
  credsPath,
  fulfillmentId,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'fulfillmentCancel',
    {
      id: {
        type: 'ID!',
        value: `gid://shopify/Fulfillment/${ fulfillmentId }`,
      },
    },
    `fulfillment { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  return response;
};

const shopifyFulfillmentCancel = async (
  credsPath,
  fulfillmentId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    fulfillmentId,
    shopifyFulfillmentCancelSingle,
    (fulfillmentId) => ({
      args: [credsPath, fulfillmentId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  return response;
};

const shopifyFulfillmentCancelApi = funcApi(shopifyFulfillmentCancel, {
  argNames: ['credsPath', 'fulfillmentId', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    fulfillmentId: (p) => {
      if (Array.isArray(p)) {
        return p.length > 0 && p.every(Boolean);
      }
      return Boolean(p);
    },
  },
});

module.exports = {
  shopifyFulfillmentCancel,
  shopifyFulfillmentCancelSingle,
  shopifyFulfillmentCancelApi,
};

// curl http://localhost:8000/shopifyFulfillmentCancel -H 'Content-Type: application/json' -d '{ "credsPath": "au", "fulfillmentId": "1234567890" }'
