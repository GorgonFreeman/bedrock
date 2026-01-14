const { funcApi, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const logiwaWebhookUnsubscribe = async (
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

const logiwaWebhookUnsubscribeApi = funcApi(logiwaWebhookUnsubscribe, {
  argNames: ['orderId', 'options'],
});

module.exports = {
  logiwaWebhookUnsubscribe,
  logiwaWebhookUnsubscribeApi,
};

// curl localhost:8000/logiwaWebhookUnsubscribe -H "Content-Type: application/json" -d '{ "orderId": "9ce5f6f0-c461-4d1c-93df-261a2188d652" }'