// https://mydeveloper.logiwa.com/#tag/ShipmentOrder/paths/~1v3.1~1ShipmentOrder~1%7Bid%7D/get

const { respond, mandateParam, logDeep, objHasAny, actionMultipleOrSingle } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');
const { logiwaOrdersList } = require('../logiwa/logiwaOrdersList');

const logiwaOrderGetSingle = async (
  {
    orderId, // Logiwa order UUID
    orderCode, // Shopify order name
  },
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {

  if (orderId) {
    const response = await logiwaClient.fetch({
      method: 'get',
      url: `/ShipmentOrder/${ orderId }`,
    });
    // logDeep(response);
    return response;
  }

  /* orderCode */
  const response = await logiwaOrdersList({
    credsPath,
    apiVersion,
    code_eq: orderCode,
  });

  const { success, result } = response;

  if (!success || !result) {
    return response;
  }

  if (result.length > 1) {
    return {
      success: false,
      error: [{
        message: 'Multiple orders found',
        data: result,
      }],
    };
  }

  const order = result?.[0];

  if (!order) {
    return {
      success: false,
      error: ['Order not found'],
    };
  }
  
  const transformedResponse = {
    success: true,
    result: order,
  };
  // logDeep(transformedResponse);
  return transformedResponse;
  /* /orderCode */
};

const logiwaOrderGet = async (
  orderIdentifier,
  options,
) => {
  const response = await actionMultipleOrSingle(
    orderIdentifier,
    logiwaOrderGetSingle,
    (orderIdentifier) => ({ 
      args: [orderIdentifier], 
      options, 
    }),
    {
      ...(options?.queueRunOptions ? { queueRunOptions: options.queueRunOptions } : {}),
    },
  );
  logDeep(response);
  return response;
};

const logiwaOrderGetApi = async (req, res) => {
  const { 
    orderIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'orderIdentifier', orderIdentifier, p => objHasAny(p, ['orderId', 'orderCode'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await logiwaOrderGet(
    orderIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaOrderGet,
  logiwaOrderGetApi,
};

// curl localhost:8000/logiwaOrderGet -H "Content-Type: application/json" -d '{ "orderIdentifier": { "orderId": "9ce5f6f0-c461-4d1c-93df-261a2188d652" } }'
// curl localhost:8000/logiwaOrderGet -H "Content-Type: application/json" -d '{ "orderIdentifier": { "orderCode": "#USA4395473" } }'