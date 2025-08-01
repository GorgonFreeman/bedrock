const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyWebhookUpdate = async (
  webhookId,
  updatePayload,
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
    url: `/shops/${ shopId }/webhooks/${ webhookId }.json`,
    method: 'put',
    body: updatePayload,
    verbose: true,
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
  
};

const printifyWebhookUpdateApi = async (req, res) => {
  const { 
    webhookId,
    updatePayload,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'webhookId', webhookId),
    mandateParam(res, 'updatePayload', updatePayload),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyWebhookUpdate(
    webhookId,
    updatePayload,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyWebhookUpdate,
  printifyWebhookUpdateApi,
};

// curl localhost:8000/printifyWebhookUpdate -H "Content-Type: application/json" -d '{ "webhookId": "1234", "updatePayload": { ... } }'