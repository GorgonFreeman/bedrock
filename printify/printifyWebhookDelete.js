const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyWebhookDelete = async (
  webhookId,
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

  const response = await printifyClient.fetch({
    url: '/things.json', 
    verbose: true,
    credsPath,  });

  logDeep(response);
  return response;
  
};

const printifyWebhookDeleteApi = async (req, res) => {
  const { 
    webhookId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'webhookId', webhookId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyWebhookDelete(
    webhookId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyWebhookDelete,
  printifyWebhookDeleteApi,
};

// curl localhost:8000/printifyWebhookDelete -H "Content-Type: application/json" -d '{ "webhookId": "123" }'