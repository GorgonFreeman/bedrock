// https://mydeveloper.logiwa.com/#tag/Webhook/paths/~1v3.1~1Webhook~1status~1%7Bidentifier%7D/get

const { funcApi, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const logiwaWebhookStatusGet = async (
  subscriptionId,
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {

  const response = await logiwaClient.fetch({
    method: 'get',
    url: `/Webhook/status/${ subscriptionId }`,
    context: {
      credsPath,
      apiVersion,
    },
  });
  logDeep(response);
  return response;
};

const logiwaWebhookStatusGetApi = funcApi(logiwaWebhookStatusGet, {
  argNames: ['subscriptionId', 'options'],
});

module.exports = {
  logiwaWebhookStatusGet,
  logiwaWebhookStatusGetApi,
};

// curl localhost:8000/logiwaWebhookStatusGet -H "Content-Type: application/json" -d '{ "subscriptionId": "68706c98-0198-4671-9a97-4b3e3e59a56d" }'