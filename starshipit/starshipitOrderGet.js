const { respond, mandateParam, credsByPath, customAxios, logDeep } = require('../utils');

const starshipitOrderGet = async (
  credsPath,
  orderId,
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
      order_number: orderId,
    },
    headers,
  });

  logDeep(response);
  return response;
};

const starshipitOrderGetApi = async (req, res) => {
  const { 
    credsPath,
    orderId,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'orderId', orderId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await starshipitOrderGet(
    credsPath,
    orderId,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitOrderGet,
  starshipitOrderGetApi,
};

// curl localhost:8000/starshipitOrderGet -H "Content-Type: application/json" -d '{ "credsPath": "wf", "orderId": 5989356896328 }'