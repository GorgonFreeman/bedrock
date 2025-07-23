const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyWebhookCreate = async (
  topic,
  webhookUrl,
  {
    credsPath,
    shopId,
  } = {},
) => {

  if (!shopId) {
    const { SHOP_ID } = credsByPath(['printify', credsPath]);
    shopId = SHOP_ID;
  }

  if (!shopId) {
    return {
      success: false,
      error: ['shopId is required'],
    };
  }

  const webhookData = {
    topic,
    url: webhookUrl,
  };

  const response = await printifyClient.fetch({
    url: `/shops/${ shopId }/webhooks.json`,
    method: 'post',
    body: webhookData,
    verbose: true,
    credsPath,
  });

  logDeep(response);
  return response;
  
};

const printifyWebhookCreateApi = async (req, res) => {
  const { 
    topic,
    webhookUrl,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'topic', topic),
    mandateParam(res, 'webhookUrl', webhookUrl),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyWebhookCreate(
    topic,
    webhookUrl,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyWebhookCreate,
  printifyWebhookCreateApi,
};

// curl localhost:8000/printifyWebhookCreate -H "Content-Type: application/json" -d '{ "topic": "order:shipment:created", "webhookUrl": "..." }'