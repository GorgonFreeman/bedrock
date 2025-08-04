const { respond, mandateParam, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');
const { logiwaAuthGet } = require('../logiwa/logiwaAuthGet');

const logiwaOrderGet = async (
  orderId,
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {

  const authResponse = await logiwaAuthGet({ credsPath, apiVersion });
  if (!authResponse?.success) {
    return authResponse;
  }

  const authToken = authResponse?.result;

  const headers = {
    Authorization: `Bearer ${ authToken }`,
  };

  const response = await logiwaClient.fetch({
    method: 'get',
    url: `/ShipmentOrder/${ orderId }`,
    headers,
  });
  logDeep(response);
  return response;
};

const logiwaOrderGetApi = async (req, res) => {
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

  const result = await logiwaOrderGet(
    orderId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaOrderGet,
  logiwaOrderGetApi,
};

// curl localhost:8000/logiwaOrderGet -H "Content-Type: application/json" -d '{ "orderId": "81ebb08f-fcf6-4d42-a31b-bfbe77a2abc1" }'