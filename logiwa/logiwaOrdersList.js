// https://mydeveloper.logiwa.com/#tag/ShipmentOrder/paths/~1v3.1~1ShipmentOrder~1list~1i~1%7Bindex%7D~1s~1%7Bsize%7D/get

const { respond, mandateParam, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const logiwaOrdersList = async (
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

const logiwaOrdersListApi = async (req, res) => {
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

  const result = await logiwaOrdersList(
    orderId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  logiwaOrdersList,
  logiwaOrdersListApi,
};

// curl localhost:8000/logiwaOrdersList -H "Content-Type: application/json" -d '{ "orderId": "9ce5f6f0-c461-4d1c-93df-261a2188d652" }'