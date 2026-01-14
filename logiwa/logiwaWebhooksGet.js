// https://mydeveloper.logiwa.com/#tag/Webhook/paths/~1v3.1~1Webhook~1list/get

const { funcApi, logDeep } = require('../utils');
const { logiwaClient } = require('../logiwa/logiwa.utils');

const logiwaWebhooksGet = async (
  {
    credsPath,
    apiVersion = 'v3.1',
  } = {},
) => {

  const response = await logiwaClient.fetch({
    method: 'get',
    url: `/Webhook/list`,
    context: {
      credsPath,
      apiVersion,
    },
  });
  logDeep(response);
  return response;
};

const logiwaWebhooksGetApi = funcApi(logiwaWebhooksGet, {
  argNames: ['options'],
});

module.exports = {
  logiwaWebhooksGet,
  logiwaWebhooksGetApi,
};

// curl localhost:8000/logiwaWebhooksGet -H "Content-Type: application/json" -d '{ "orderId": "9ce5f6f0-c461-4d1c-93df-261a2188d652" }'