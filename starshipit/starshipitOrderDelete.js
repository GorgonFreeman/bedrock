const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');
const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');

const starshipitOrderDelete = async (
  credsPath,
  {
    orderId,
    orderNumber,
  },
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
    url: '/orders/delete',
    method: 'delete',
    params: {
      order_id: orderId,
    },
    factoryArgs: [{ credsPath }],
  });

  logDeep(response);
  return response;
};

const starshipitOrderDeleteApi = async (req, res) => {
  const { 
    credsPath,
    orderIdentifier,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'orderIdentifier', orderIdentifier, p => objHasAny(p, ['orderId', 'orderNumber'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await starshipitOrderDelete(
    credsPath,
    orderIdentifier,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitOrderDelete,
  starshipitOrderDeleteApi,
};

// curl localhost:8000/starshipitOrderDelete -H "Content-Type: application/json" -d '{ "credsPath": "wf", "orderIdentifier": { "orderNumber": "..." } }' 
// curl localhost:8000/starshipitOrderDelete -H "Content-Type: application/json" -d '{ "credsPath": "wf", "orderIdentifier": { "orderId": "408418809" } }' 