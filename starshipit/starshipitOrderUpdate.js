// https://api-docs.starshipit.com/#c96bed4f-3a89-4e97-abaa-b1775cc7c5a7

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');
const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');

const starshipitOrderUpdate = async (
  credsPath,
  {
    orderId,
    orderNumber,
  },
  updatePayload,
) => {

  if (!orderId) {
    // If no order ID is provided, we can assume order number is provided due to mandateParam
    const starshipitOrderResponse = await starshipitOrderGet(credsPath, { orderNumber });

    if (!starshipitOrderResponse?.success) {
      return starshipitOrderResponse;
    }
    
    orderId = starshipitOrderResponse?.result?.order_id;
  }

  if (!orderId) {
    return {
      success: false,
      error: ['No order ID found'],
    };
  }

  const response = await starshipitClient.fetch({
    url: '/orders',
    method: 'put',
    body: {
      order: {
        order_id: orderId,
        ...updatePayload,
      },
    },
    factoryArgs: [{ credsPath }],
  });

  logDeep(response);
  return response;
};

const starshipitOrderUpdateApi = async (req, res) => {
  const { 
    credsPath,
    orderIdentifier,
    updatePayload,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'orderIdentifier', orderIdentifier, p => objHasAny(p, ['orderId', 'orderNumber'])),
    mandateParam(res, 'updatePayload', updatePayload),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await starshipitOrderUpdate(
    credsPath,
    orderIdentifier,
    updatePayload,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitOrderUpdate,
  starshipitOrderUpdateApi,
};

// curl localhost:8000/starshipitOrderUpdate -H "Content-Type: application/json" -d '{ "credsPath": "wf", "orderIdentifier": { "orderNumber": "7029471248456" }, "updatePayload": { "destination": { "name": "Big Dog" } } }' 
// curl localhost:8000/starshipitOrderUpdate -H "Content-Type: application/json" -d '{ "credsPath": "wf", "orderIdentifier": { "orderId": "408418809" } }' 