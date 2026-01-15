// https://apidoc.pipe17.com/#/operations/listOrders

const { funcApi, logDeep } = require('../utils');
const { pipe17Get } = require('../pipe17/pipe17.utils');

const pipe17OrdersGet = async (
  {
    credsPath,
    
    // API options
    autoEngUpdateStatus,
    autoEngUpdateStatusUpdatedSince,
    autoEngUpdateStatusUpdatedUntil,
    count,
    deleted,
    disposition, // partiallyRouted routed partiallySent sent partiallyFulfilled fulfilled partiallyCanceled canceled partiallyFailed failed partiallyRejected rejected partiallyUnrouted unrouted partiallyUnsent unsent partiallyUnfulfilled unfulfilled 
    email,
    emailAddr,
    exceptionCategoryId,
    exceptionType,
    extOrderId,
    holdUntilSince,
    holdUntilUntil,
    integration,
    keys, // Default: orderId,extOrderId,email,status,shipByDate,fulfilledAt,expectedDeliveryDate,tags,createdAt,updatedAt,orgKey 
    lastRerunRoutingTrigger, // manual auto
    locationId, // Default: createdAt orderId array[string] Fetch orders by list of orderId
    orderSource,
    orderSourceType, // online pos wholesale edi other b2b aggregation 
    pagination, // disabled 
    requireShippingLabels,
    routingStatus, // disabled pending ready acknowledged failed excluded pendingInventory
    since,
    skip,
    status, // draft new onHold toBeValidated reviewRequired readyForFulfillment sentToFulfillment partialFulfillment fulfilled inTransit partialReceived received canceled returned refunded archived closed 
    tags,
    timestamp, 
    until,
    updatedSince,
    updatedUntil,

    ...getterOptions
  } = {},
) => {

  const params = {
    ...autoEngUpdateStatus && { autoEngUpdateStatus },
    ...autoEngUpdateStatusUpdatedSince && { autoEngUpdateStatusUpdatedSince },
    ...autoEngUpdateStatusUpdatedUntil && { autoEngUpdateStatusUpdatedUntil },
    ...count && { count },
    ...deleted && { deleted },
    ...disposition && { disposition },
    ...email && { email },
    ...emailAddr && { emailAddr },
    ...exceptionCategoryId && { exceptionCategoryId },
    ...exceptionType && { exceptionType },
    ...extOrderId && { extOrderId },
    ...holdUntilSince && { holdUntilSince },
    ...holdUntilUntil && { holdUntilUntil },
    ...integration && { integration },
    ...keys && { keys },
    ...lastRerunRoutingTrigger && { lastRerunRoutingTrigger },
    ...locationId && { locationId },
    ...orderSource && { orderSource },
    ...orderSourceType && { orderSourceType },
    ...pagination && { pagination },
    ...requireShippingLabels && { requireShippingLabels },
    ...routingStatus && { routingStatus },
    ...since && { since },
    ...skip && { skip },
    ...status && { status },
    ...tags && { tags },
    ...timestamp && { timestamp } ,
    ...until && { until },
    ...updatedSince && { updatedSince },
    ...updatedUntil && { updatedUntil },
  };

  const response = await pipe17Get(
    '/orders', 
    'orders', 
    {
      credsPath,
      params,
      ...getterOptions,
    },
  );

  logDeep(response);
  return response;
};

const pipe17OrdersGetApi = funcApi(pipe17OrdersGet, {
  argNames: ['options'],
});

module.exports = {
  pipe17OrdersGet,
  pipe17OrdersGetApi,
};

// curl localhost:8000/pipe17OrdersGet -H "Content-Type: application/json" -d '{ "options": { "limit": 50 } }'