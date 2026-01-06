// Cancels the current outstanding fulfillment with a 3rd party fulfillment provider, and recreates it.

const { funcApi, logDeep, gidToId, askQuestion } = require('../utils');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { shopifyFulfillmentOrderSubmitCancellationRequest } = require('../shopify/shopifyFulfillmentOrderSubmitCancellationRequest');
const { shopifyFulfillmentOrderSubmitFulfillmentRequest } = require('../shopify/shopifyFulfillmentOrderSubmitFulfillmentRequest');

const FULFILLMENT_ORDERS_FETCHED = 50;

const attrs = `
  id 
  displayFulfillmentStatus
  fulfillmentOrders (first:${ FULFILLMENT_ORDERS_FETCHED }) { 
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
    forceCancellation = false,
    cancelMessage,
    fulfillMessage,
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

  if (fulfillmentOrders.length >= FULFILLMENT_ORDERS_FETCHED) {
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
    
    let fulfillmentOrderIdToSubmit;

    const cancelRequestStatuses = [
      'ACCEPTED',
      'SUBMITTED',
    ];
    const submitRequestStatuses = [
      'UNSUBMITTED',
    ];

    if (cancelRequestStatuses.includes(requestStatus)) {
      // Submit cancellation requests
      const requestCancellationResponse = await shopifyFulfillmentOrderSubmitCancellationRequest(
        credsPath,
        fulfillmentOrderId,
        {
          apiVersion,
          ...cancelMessage && { message: cancelMessage },
        },
      );

      const { success: requestCancellationSuccess, result: requestCancellation } = requestCancellationResponse;
      if (!requestCancellationSuccess) {
        return requestCancellationResponse;
      }
      
      // TODO: Consider including the result status in the assessment of success
      logDeep(requestCancellation);
      await askQuestion('?');

      // If forcing cancellation, revert the order to unfulfilled
      if (!forceCancellation) {
        console.log(`Wait for the fulfillment service to accept the cancellation, then run again to submit a new request.`);
        continue;
      }

      const fulfillmentOrderCancelResponse = await shopifyFuflillmentOrderCancel(
        credsPath,
        fulfillmentOrderId,
        {
          apiVersion,
          returnAttrs: 'fulfillmentOrder { status requestStatus } replacementFulfillmentOrder { id status requestStatus }',
        },
      );

      const { success: fulfillmentOrderCancelSuccess, result: fulfillmentOrderCancelResult } = fulfillmentOrderCancelResponse;
      if (!fulfillmentOrderCancelSuccess) {
        return fulfillmentOrderCancelResponse;
      }

      logDeep(fulfillmentOrderCancelResult);
      await askQuestion('?'); 

      const {
        replacementFulfillmentOrder,
      } = fulfillmentOrderCancelResult;
      const {
        id: replacementFulfillmentOrderGid,
      } = replacementFulfillmentOrder;
      const replacementFulfillmentOrderId = gidToId(replacementFulfillmentOrderGid);

      fulfillmentOrderIdToSubmit = replacementFulfillmentOrderId;

    } else if (submitRequestStatuses.includes(requestStatus)) {

      fulfillmentOrderIdToSubmit = fulfillmentOrderId;

    } else {
      return {
        success: false,
        errors: [`${ region }:${ orderId }: Unrecognised fulfillment order request status ${ requestStatus }. Please handle this case in the function.`],
        data: fo,
      };
    }

    if (!fulfillmentOrderIdToSubmit) {
      continue;
    }

    const requestSubmitResponse = await shopifyFulfillmentOrderSubmitFulfillmentRequest(
      credsPath,
      fulfillmentOrderIdToSubmit,
      {
        apiVersion,
        ...fulfillMessage && { message: fulfillMessage },
      },
    );

    const { success: requestSubmitSuccess, result: requestSubmitResult } = requestSubmitResponse;
    if (!requestSubmitSuccess) {
      return requestSubmitResponse;
    }

    logDeep(requestSubmitResult);
    await askQuestion('?');

  }

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