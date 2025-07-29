const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitOrderGet = async (
  credsPath,
  {
    orderId,
    orderNumber,
  },
) => {

  const response = await starshipitClient.fetch({
    url: '/orders',
    params: {
      ...orderId ? { order_id: orderId } : {},
      ...orderNumber ? { order_number: orderNumber } : {},
    },
    factoryArgs: [{ credsPath }],
    interpreter: (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result.order,
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const starshipitOrderGetApi = async (req, res) => {
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

  const result = await starshipitOrderGet(
    credsPath,
    orderIdentifier,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitOrderGet,
  starshipitOrderGetApi,
};

// curl localhost:8000/starshipitOrderGet -H "Content-Type: application/json" -d '{ "credsPath": "wf", "orderIdentifier": { "orderId": 408418809 } }'
// curl localhost:8000/starshipitOrderGet -H "Content-Type: application/json" -d '{ "credsPath": "wf", "orderIdentifier": { "orderNumber": 5989356896328 } }'