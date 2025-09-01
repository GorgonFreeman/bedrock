// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fulfillmentCreateV2

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id displayStatus`;

const shopifyFulfillmentOrderFulfill = async (
  credsPath,
  fulfillmentOrderId,
  {
    apiVersion,

    notifyCustomer, // true or false
    originAddress, // { countryCode, ... }
    trackingInfo, // { number, company, url }

    externalLineItems,

    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'fulfillmentCreateV2',
    {
      fulfillment: {
        type: 'FulfillmentCreateV2Input!',
        value: {
          ...notifyCustomer && { notifyCustomer },
          ...originAddress && { originAddress },
          ...trackingInfo && { trackingInfo },
          // ...fulfillPayloadLineItems && { lineItemsByFulfillmentOrder: [{
          //   fulfillmentOrderId: fulfillmentOrderGid,
          //   fulfillmentOrderLineItems: fulfillPayloadLineItems,
          // }] },
        },
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

const shopifyFulfillmentOrderFulfillApi = async (req, res) => {
  const {
    credsPath,
    fulfillmentOrderId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'fulfillmentOrderId', fulfillmentOrderId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyFulfillmentOrderFulfill(
    credsPath,
    fulfillmentOrderId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyFulfillmentOrderFulfill,
  shopifyFulfillmentOrderFulfillApi,
};

// curl http://localhost:8000/shopifyFulfillmentOrderFulfill -H 'Content-Type: application/json' -d '{ "credsPath": "au", "fulfillmentOrderId": "13073972003189" }'