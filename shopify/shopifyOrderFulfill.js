// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fulfillmentCreateV2

const { respond, mandateParam, logDeep, askQuestion } = require('../utils');
const { shopifyClient, shopifyFulfillmentLineItemsFromExternalLineItems } = require('../shopify/shopify.utils');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');

const shopifyOrderFulfill = async (
  credsPath,
  orderIdentifier,
  {
    apiVersion,

    notifyCustomer, // true or false
    originAddress, // { countryCode, ... }
    trackingInfo, // { number, company, url }

    externalLineItems,
  } = {},
) => {

  // 1. Identify single open fulfillment order
  const fulfillmentOrderAttrs = `
    fulfillmentOrders (
      displayable: true, 
      query: "request_status:UNSUBMITTED OR request_status:ACCEPTED", 
      first: 2,
    ) {
      edges {
        node {
          id
          requestStatus
          ${ externalLineItems ? `
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
          ` : '' }
        }
      }
    }
  `;

  const fulfillmentsResponse = await shopifyOrderGet(
    credsPath, 
    orderIdentifier, 
    {
      apiVersion,
      attrs: fulfillmentOrderAttrs,
    },
  );
  logDeep(fulfillmentsResponse);

  const {
    success: fulfillmentsSuccess,
    result: fulfillments,
  } = fulfillmentsResponse;

  if (!fulfillmentsSuccess) {
    return fulfillmentsResponse;
  }

  const fulfillmentOrders = fulfillments?.fulfillmentOrders;
  
  if (!fulfillmentOrders?.length) {
    return {
      success: false,
      error: ['No fulfillment orders found'],
    };
  }

  if (fulfillmentOrders?.length > 1) {
    return {
      success: false,
      error: [{
        message: 'Multiple fulfillment orders found',
        data: fulfillmentOrders,
      }],
    };
  }

  const fulfillmentOrder = fulfillmentOrders?.[0];

  if (!fulfillmentOrder) {
    return {
      success: false,
      error: ['No fulfillment order found'],
    };
  }
 
  // console.log(fulfillmentOrder);
  // await askQuestion('Continue?');

  const { id: fulfillmentOrderGid } = fulfillmentOrder;

  // 2. Fulfill it
  const mutationName = 'fulfillmentCreateV2';

  const mutation = `
    mutation ${ mutationName }($fulfillment: FulfillmentV2Input!) {
      ${ mutationName }(fulfillment: $fulfillment) {
        fulfillment {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  let fulfillPayloadLineItems;
  if (externalLineItems) {

    const { lineItems } = fulfillmentOrder;

    if (lineItems.length >= 100) {
      return {
        success: false,
        error: ['Order could have >100 line items, so this function is not equipped to handle it'],
      };
    }

    const shippableLineItems = lineItems?.filter(lineItem => lineItem?.requiresShipping === true);

    fulfillPayloadLineItems = shopifyFulfillmentLineItemsFromExternalLineItems(externalLineItems, shippableLineItems, { 
      extSkuProp: 'skuId',
      shopifyQuantityProp: 'remainingQuantity', 
    });
  }

  const variables = {
    fulfillment: {
      ...notifyCustomer && { notifyCustomer },
      ...originAddress && { originAddress },
      ...trackingInfo && { trackingInfo },
      ...fulfillPayloadLineItems && { lineItemsByFulfillmentOrder: [{
        fulfillmentOrderId: fulfillmentOrderGid,
        fulfillmentOrderLineItems: fulfillPayloadLineItems,
      }] },
    },
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query: mutation, variables },
    context: {
      credsPath,
      apiVersion,
    },
    interpreter: async (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result[mutationName],
        } : {},
      };
    },
  });

  // logDeep(response);
  return response;
};

const shopifyOrderFulfillApi = async (req, res) => {
  const { 
    credsPath,
    orderIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'orderIdentifier', orderIdentifier, p => objHasAny(p, ['orderId', 'orderName'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyOrderFulfill(
    credsPath,
    orderIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyOrderFulfill,
  shopifyOrderFulfillApi,
};

/*
  curl localhost:8000/shopifyOrderFulfill \
    -H "Content-Type: application/json" \
    -d '{ 
      "credsPath": "au", 
      "orderIdentifier": { "orderId": "6993917280328" }, 
      "options": { 
        "notifyCustomer": false, 
        "originAddress": { 
          "countryCode": "AU" 
        }, 
        "trackingInfo": { 
          "number": "33VVY5069794010075115021965" 
        } 
      } 
    }'
*/