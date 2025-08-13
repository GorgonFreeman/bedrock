const { respond, mandateParam, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const logiwaProductsGet = async (
  orderId,
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {

  const response = await logiwaClient.fetch({
    method: 'get',
    url: `/ShipmentOrder/${ orderId }`,
  });
  logDeep(response);
  return response;
};

const logiwaProductsGetApi = async (req, res) => {
  const { 
    orderId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'orderId', orderId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await logiwaProductsGet(
    orderId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaProductsGet,
  logiwaProductsGetApi,
};

// curl localhost:8000/logiwaProductsGet -H "Content-Type: application/json" -d '{ "orderId": "9ce5f6f0-c461-4d1c-93df-261a2188d652" }'