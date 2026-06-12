// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fulfillmentTrackingInfoUpdate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `
  id
  status
  trackingInfo {
    company
    number
    url
  }
`;

const shopifyFulfillmentTrackingInfoUpdate = async (
  credsPath,
  fulfillmentId,
  trackingInfoPayload,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
    notifyCustomer = false,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'fulfillmentTrackingInfoUpdate',
    {
      fulfillmentId: {
        type: 'ID!',
        value: `gid://shopify/Fulfillment/${ fulfillmentId }`,
      },
      trackingInfoInput: {
        type: 'FulfillmentTrackingInput!',
        value: trackingInfoPayload,
      },
      ...notifyCustomer && { notifyCustomer },
    },
    `fulfillment { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyFulfillmentTrackingInfoUpdateApi = funcApi(shopifyFulfillmentTrackingInfoUpdate, {
  argNames: [
    'credsPath', 
    'fulfillmentId', 
    'trackingInfoPayload', 
    'options',
  ],
  validatorsByArg: {
    credsPath: Boolean,
    fulfillmentId: Boolean,
    trackingInfoPayload: Boolean,
  },
});

module.exports = {
  shopifyFulfillmentTrackingInfoUpdate,
  shopifyFulfillmentTrackingInfoUpdateApi,
};

// curl http://localhost:8000/shopifyFulfillmentTrackingInfoUpdate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "pageInput": { "title": "Batarang Blueprints", "body": "<strong>Good page!</strong>" }, "options": { "returnAttrs": "id" } }'