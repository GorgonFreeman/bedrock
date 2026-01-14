// https://mydeveloper.logiwa.com/#tag/Webhook/paths/~1v3.1~1Webhook~1create/post

const { funcApi, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const logiwaWebhookSubscribe = async (
  topic,
  url,
  {
    credsPath,
    apiVersion = 'v3.1',
    clientIdentifier,
  } = {},
) => {

  const response = await logiwaClient.fetch({
    method: 'post',
    url: `/Webhook/create`,
    body: {
      topic,
      address: url,
      ...clientIdentifier ? { clientIdentifier } : { ignoreClient: true },
    },
    context: {
      credsPath,
      apiVersion,
    },
  });
  logDeep(response);
  return response;
};

const logiwaWebhookSubscribeApi = funcApi(logiwaWebhookSubscribe, {
  argNames: ['topic', 'url', 'options'],
  validatorsByArg: {
    topic: Boolean,
    url: Boolean,
  },
});

module.exports = {
  logiwaWebhookSubscribe,
  logiwaWebhookSubscribeApi,
};

// curl localhost:8000/logiwaWebhookSubscribe -H "Content-Type: application/json" -d '{ "topic": "wms/inventory/available", "url": "https://example.com/webhook" }'