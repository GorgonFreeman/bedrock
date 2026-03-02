const { funcApi, logDeep, interactiveChooseOption } = require('../utils');

const { shopifyWebhookSubscriptionsGet } = require('../shopify/shopifyWebhookSubscriptionsGet');
const { shopifyWebhookSubscriptionDelete } = require('../shopify/shopifyWebhookSubscriptionDelete');

const shopifyWebhookSubscriptionsDeleteInteractive = async (
  credsPath,
  {
    apiVersion,
  } = {},
) => {

  const shopifyWebhookSubscriptionsResponse = await shopifyWebhookSubscriptionsGet(credsPath, {
    apiVersion,
  });
  
  const {
    success: shopifyWebhookSubscriptionsSuccess,
    result: webhookSubs,
  } = shopifyWebhookSubscriptionsResponse;
  if (!shopifyWebhookSubscriptionsSuccess) {
    return webhookSubs;
  }


};

const shopifyWebhookSubscriptionsDeleteInteractiveApi = funcApi(shopifyWebhookSubscriptionsDeleteInteractive, {
  argNames: ['credsPath', 'arg', 'options'],
});

module.exports = {
  shopifyWebhookSubscriptionsDeleteInteractive,
  shopifyWebhookSubscriptionsDeleteInteractiveApi,
};

// curl localhost:8000/shopifyWebhookSubscriptionsDeleteInteractive -H "Content-Type: application/json" -d '{ "credsPath": "au", "arg": "6979774283848" }'