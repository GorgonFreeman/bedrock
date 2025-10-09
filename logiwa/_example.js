const { funcApi, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const FUNC = async (
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

const FUNCApi = funcApi(FUNC, {
  argNames: ['orderId', 'options'],
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "orderId": "9ce5f6f0-c461-4d1c-93df-261a2188d652" }'