// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fulfillmentCreate

const { respond, mandateParam, logDeep, askQuestion } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

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

  const fulfillmentOrderAttrs = `
    id
    status
    lineItems (first: 100) {
      edges {
        node {
          id
          sku
          remainingQuantity
          requiresShipping
        }
      }
    }
  `;

  const fulfillmentOrderResponse = await shopifyGetSingle(
    credsPath, 
    'fulfillmentOrder', 
    fulfillmentOrderId, 
    { 
      apiVersion, 
      attrs: fulfillmentOrderAttrs,
    },
  );

  const { success: fulfillmentOrderSuccess, result: fulfillmentOrder } = fulfillmentOrderResponse;

  if (!fulfillmentOrderSuccess) {
    return fulfillmentOrderResponse;
  }

  const { 
    status,
    lineItems,
  } = fulfillmentOrder;

  // TODO: Return based on status

  if (lineItems.length >= 100) {
    return {
      success: false,
      error: ['Order could have >100 line items, so this function is not equipped to handle it'],
    };
  }

  const shippableLineItems = lineItems?.filter(lineItem => lineItem?.requiresShipping === true);

  if (!shippableLineItems?.length) {
    return {
      success: false,
      error: [`Order has no shippable line items`],
    };
  }

  // If no external line items, fulfill all line items
  let fulfillPayloadLineItems;

  if (externalLineItems) {
    fulfillPayloadLineItems = shopifyFulfillmentLineItemsFromExternalLineItems(externalLineItems, lineItems, { 
      extSkuProp: 'skuId',
      shopifyQuantityProp: 'quantity',
    });
  } else {
    fulfillPayloadLineItems = lineItems.map(li => {
      return {
        id: li.id,
        quantity: li.remainingQuantity,
      };
    });
  }

  logDeep(fulfillPayloadLineItems);
  await askQuestion('?');

  const response = await shopifyMutationDo(
    credsPath,
    'fulfillmentCreate',
    {
      fulfillment: {
        type: 'FulfillmentInput!',
        value: {
          ...notifyCustomer && { notifyCustomer },
          ...originAddress && { originAddress },
          ...trackingInfo && { trackingInfo },
          ...fulfillPayloadLineItems && { lineItemsByFulfillmentOrder: [{
            fulfillmentOrderId: fulfillmentOrderGid,
            fulfillmentOrderLineItems: fulfillPayloadLineItems,
          }] },
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