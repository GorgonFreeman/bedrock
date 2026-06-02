// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fulfillmentCancel

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id status`;

const shopifyFulfillmentCancel = async (
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
  logDeep(response);
  return response;
};

const shopifyFulfillmentCancelApi = funcApi(shopifyFulfillmentCancel, {
  argNames: ['credsPath', 'fulfillmentId', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    fulfillmentId: Boolean,
  },
});

module.exports = {
  shopifyFulfillmentCancel,
  shopifyFulfillmentCancelApi,
};

// curl http://localhost:8000/shopifyFulfillmentCancel -H 'Content-Type: application/json' -d '{ "credsPath": "au", "fulfillmentId": "1234567890" }'