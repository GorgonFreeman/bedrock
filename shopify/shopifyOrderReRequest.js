// Cancels the current outstanding fulfillment with a 3rd party fulfillment provider, and recreates it.

const { funcApi, logDeep, gidToId, askQuestion } = require('../utils');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { shopifyFulfillmentOrderSubmitCancellationRequest } = require('../shopify/shopifyFulfillmentOrderSubmitCancellationRequest');
const { shopifyFulfillmentOrderSubmitFulfillmentRequest } = require('../shopify/shopifyFulfillmentOrderSubmitFulfillmentRequest');

const attrs = `
  id 
  displayFulfillmentStatus
  fulfillmentOrders (first:50) { 
    edges { 
      node { 
        id 
        requestStatus
        status
        assignedLocation {
          location {
            isFulfillmentService
            fulfillmentService {
              handle
              type
            }
          }
        }
      }
    }
  }
`;
// Note: "fulfillable" is not useful here, it's false while remaining line items are IN_PROGRESS.

const shopifyOrderReRequest = async (
  credsPath,
  orderIdentifier,
  {
    apiVersion,
  } = {},
) => {

  const orderResponse = await shopifyOrderGet(
    credsPath, 
    orderIdentifier, 
    { 
      apiVersion, 
      attrs,
    },
  );

  const { success: orderSuccess, result: order } = orderResponse;

  if (!orderSuccess) {
    return orderResponse;
  }

  const { 
    id: orderGid,
    displayFulfillmentStatus,
    fulfillmentOrders,
  } = order;
  const orderId = gidToId(orderGid);

  if (displayFulfillmentStatus === 'FULFILLED') {
    return {
      success: true,
      result: `Order is already fulfilled. No need to re-request.`,
      code: 204,
    };
  }

  if (fulfillmentOrders.length === 50) {
    return {
      success: false,
      errors: [`Order could have more than one page of fulfillment orders. Please check manually.`],
    };
  }

  const proceedStatuses = ['IN_PROGRESS']; // TODO: Consider adding UNSUBMITTED, ACCEPTED, REJECTED, etc.
  if (!proceedStatuses.includes(displayFulfillmentStatus)) {
    return {
      success: false,
      errors: [`${ region }:${ orderId }: Unrecognised order fulfillment status ${ displayFulfillmentStatus }. Please handle this case in the function.`],
    };
  }

  const fulfillmentServiceFulfillmentOrders = fulfillmentOrders.filter(fo => fo.assignedLocation?.location?.isFulfillmentService);

  if (!fulfillmentServiceFulfillmentOrders?.length) {
    return {
      success: false,
      errors: [`${ region }:${ orderId }: Expected fulfillment service fulfillment orders, but got none.`],
      data: order,
    };
  }

  for (const fo of fulfillmentServiceFulfillmentOrders) {
    const {
      id: fulfillmentOrderGid,
      requestStatus,
      status,
    } = fo;
    const fulfillmentOrderId = gidToId(fulfillmentOrderGid);

    logDeep(fo);
    await askQuestion('?');

    // Submit cancellation requests

    // If forcing cancellation, revert the order to unfulfilled
  }

  // Fetch new state of fulfillment orders

  // Submit fulfillment requests

  const response = {
    success: true,
    result: order,
  };
  logDeep(response);
  return response;
};

const shopifyOrderReRequestApi = funcApi(shopifyOrderReRequest, {
  argNames: ['credsPath', 'orderIdentifier', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    orderIdentifier: Boolean,
  },
});

module.exports = {
  shopifyOrderReRequest,
  shopifyOrderReRequestApi,
};

// curl localhost:8000/shopifyOrderReRequest -H "Content-Type: application/json" -d '{ "credsPath": "uk", "orderIdentifier": { "orderId": "12619061363061" } }'