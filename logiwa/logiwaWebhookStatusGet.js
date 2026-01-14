const { funcApi, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const logiwaWebhookStatusGet = async (
  orderId,
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {

  const response = await logiwaClient.fetch({
    method: 'get',
    url: `/ShipmentOrder/${ orderId }`,
    context: {
      credsPath,
      apiVersion,
    },
  });
  logDeep(response);
  return response;
};

const logiwaWebhookStatusGetApi = funcApi(logiwaWebhookStatusGet, {
  argNames: ['orderId', 'options'],
});

module.exports = {
  logiwaWebhookStatusGet,
  logiwaWebhookStatusGetApi,
};

// curl localhost:8000/logiwaWebhookStatusGet -H "Content-Type: application/json" -d '{ "orderId": "9ce5f6f0-c461-4d1c-93df-261a2188d652" }'