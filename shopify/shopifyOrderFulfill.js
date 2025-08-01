const { respond, mandateParam, logDeep, askQuestion } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');

const shopifyOrderFulfill = async (
  credsPath,
  orderId,
  {
    apiVersion,
    notifyCustomer,
    originAddress,
    trackingInfo,
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
        }
      }
    }
  `;

  const fulfillmentsResponse = await shopifyOrderGet(
    credsPath, 
    orderId, 
    {
      apiVersion,
      attrs: fulfillmentOrderAttrs,
    },
  );
  logDeep(fulfillmentsResponse);

  if (!fulfillmentsResponse?.success) {
    return fulfillmentsResponse;
  }

  const fulfillmentOrders = fulfillmentsResponse.result.fulfillmentOrders;

  if (fulfillmentOrders.length > 1) {
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
 
  console.log(fulfillmentOrder);
  await askQuestion('Continue?');

  // 2. Fulfill it

  return;
};

const shopifyOrderFulfillApi = async (req, res) => {
  const { 
    credsPath,
    orderId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'orderId', orderId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyOrderFulfill(
    credsPath,
    orderId,
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
      "orderId": "6993917280328", 
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