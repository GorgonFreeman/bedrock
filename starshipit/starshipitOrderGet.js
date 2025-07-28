const { respond, mandateParam, credsByPath, customAxios, logDeep, objHasAny } = require('../utils');

const starshipitOrderGet = async (
  credsPath,
  {
    orderId,
    orderNumber,
  },
) => {

  const { 
    API_KEY,
    SUB_KEY,
  } = credsByPath(['starshipit', credsPath]);

  const headers = {
    'StarShipIT-Api-Key': API_KEY,
    'Ocp-Apim-Subscription-Key': SUB_KEY,
  };

  const response = await customAxios(`https://api.starshipit.com/api/orders`, {
    params: {
      ...orderId ? { order_id: orderId } : {},
      ...orderNumber ? { order_number: orderNumber } : {},
    },
    headers,
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