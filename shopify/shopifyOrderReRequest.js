// Cancels the current outstanding fulfillment with a 3rd party fulfillment provider, and recreates it.

const { funcApi, logDeep, gidToId, askQuestion, actionMultipleOrSingle } = require('../utils');
const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');
const { shopifyFulfillmentOrderSubmitCancellationRequest } = require('../shopify/shopifyFulfillmentOrderSubmitCancellationRequest');
const { shopifyFulfillmentOrderSubmitFulfillmentRequest } = require('../shopify/shopifyFulfillmentOrderSubmitFulfillmentRequest');
const { shopifyFuflillmentOrderCancel } = require('../shopify/shopifyFuflillmentOrderCancel');

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
        supportedActions {
          action
          externalUrl
        }
      }
    }
  }
`;
// Note: "fulfillable" is not useful here, it's false while remaining line items are IN_PROGRESS.

const shopifyOrderReRequestSingle = async (
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

  const responses = [];

  for (const fo of fulfillmentServiceFulfillmentOrders) {
    let {
      id: fulfillmentOrderGid,
      supportedActions,
      requestStatus,
    } = fo;
    const fulfillmentOrderId = gidToId(fulfillmentOrderGid);
    supportedActions = supportedActions.map(sa => sa.action);

    logDeep(fo);
    await askQuestion('?');

    const response = {};
    
    let idToRequestCancellation;
    let idToCancel;
    let idToRequestFulfillment;

    if (supportedActions.includes('REQUEST_CANCELLATION')) {

      idToRequestCancellation = fulfillmentOrderId;
      if (forceCancellation) {
        idToCancel = fulfillmentOrderId;
      }

    } else if (supportedActions.includes('CANCEL_FULFILLMENT_ORDER')) { // only SUBMITTED and CANCELLATION_REQUESTED

      if (requestStatus === 'CANCELLATION_REQUESTED' && !forceCancellation) {
        console.log(`Wait for the fulfillment service to accept the cancellation, then run again to request fulfillment.`);
        continue;
      }
       
      // If forcing cancellation, revert the order to unfulfilled
      idToCancel = fulfillmentOrderId;

    } else if (supportedActions.includes('REQUEST_FULFILLMENT')) {
      idToRequestFulfillment = fulfillmentOrderId;
    }

    if (!(idToRequestCancellation || idToCancel || idToRequestFulfillment)) {
      continue;
    }
    
    if (idToRequestCancellation) {
      logDeep(`Requesting cancellation for fulfillment order ${ fulfillmentOrderId }`, fo);
      await askQuestion('?');

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
      logDeep({ requestCancellation });

      response.requestCancellationResponse = requestCancellationResponse;
    }

    if (idToCancel) {
      logDeep(`Cancelling fulfillment order ${ fulfillmentOrderId }`, fo);
      await askQuestion('?');

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

      logDeep({ fulfillmentOrderCancelResult });

      response.fulfillmentOrderCancelResponse = fulfillmentOrderCancelResponse;

      const {
        replacementFulfillmentOrder,
      } = fulfillmentOrderCancelResult;
      const {
        id: replacementFulfillmentOrderGid,
      } = replacementFulfillmentOrder;
      const replacementFulfillmentOrderId = gidToId(replacementFulfillmentOrderGid);

      idToRequestFulfillment = replacementFulfillmentOrderId;
    }

    if (idToRequestFulfillment) {
      logDeep(`Requesting fulfillment for fulfillment order ${ idToRequestFulfillment }`, fo);
      await askQuestion('?');

      const requestFulfillmentResponse = await shopifyFulfillmentOrderSubmitFulfillmentRequest(
        credsPath,
        idToRequestFulfillment,
        {
          apiVersion,
          ...fulfillMessage && { message: fulfillMessage },
        },
      );
  
      const { success: requestFulfillmentSuccess, result: requestFulfillmentResult } = requestFulfillmentResponse;
      if (!requestFulfillmentSuccess) {
        return requestFulfillmentResponse;
      }
  
      logDeep({ requestFulfillmentResult });

      response.requestFulfillmentResponse = requestFulfillmentResponse;
    }

    responses.push(response);
  }

  const response = {
    success: true,
    result: responses,
  };
  return response;
};

const shopifyOrderReRequest = async (
  credsPath,
  orderIdentifier,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    orderIdentifier,
    shopifyOrderReRequestSingle,
    (orderIdentifier) => ({
      args: [credsPath, orderIdentifier],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
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
// curl localhost:8000/shopifyOrderReRequest -H "Content-Type: application/json" -d '{ "credsPath": "uk", "orderIdentifier": { "orderId": "12619061363061" }, "options": { "forceCancellation": true } }'