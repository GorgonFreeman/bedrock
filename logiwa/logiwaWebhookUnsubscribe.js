// https://mydeveloper.logiwa.com/#tag/Webhook/paths/~1v3.1~1Webhook~1unsubscribe~1%7BsubscriptionIdentifier%7D/delete
 
const { funcApi, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const logiwaWebhookUnsubscribe = async (
  subscriptionId,
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {

  const response = await logiwaClient.fetch({
    method: 'delete',
    url: `/Webhook/unsubscribe/${ subscriptionId }`,
    context: {
      credsPath,
      apiVersion,
    },
  });
  logDeep(response);
  return response;
};

const logiwaWebhookUnsubscribeApi = funcApi(logiwaWebhookUnsubscribe, {
  argNames: ['subscriptionId', 'options'],
  validatorsByArg: {
    subscriptionId: (value) => typeof value === 'string' && value.length > 0,
  },
});

module.exports = {
  logiwaWebhookUnsubscribe,
  logiwaWebhookUnsubscribeApi,
};

// curl localhost:8000/logiwaWebhookUnsubscribe -H "Content-Type: application/json" -d '{ "subscriptionId": "68706c98-0198-4671-9a97-4b3e3e59a56d" }'