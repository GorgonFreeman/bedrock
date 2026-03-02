const { funcApi, logDeep, interactiveChooseMultiple } = require('../utils');

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

  const subscriptionsToDelete = await interactiveChooseMultiple(
    'Choose subscriptions to delete',
    webhookSubs,
    {
      nameNode: 'topic',
    },
  );

  logDeep('subscriptionsToDelete', subscriptionsToDelete);

  return {
    success: true,
    result: subscriptionsToDelete,
  }
};

const shopifyWebhookSubscriptionsDeleteInteractiveApi = funcApi(shopifyWebhookSubscriptionsDeleteInteractive, {
  argNames: ['credsPath', 'options'],
});

module.exports = {
  shopifyWebhookSubscriptionsDeleteInteractive,
  shopifyWebhookSubscriptionsDeleteInteractiveApi,
};

// curl localhost:8000/shopifyWebhookSubscriptionsDeleteInteractive -H "Content-Type: application/json" -d '{ "credsPath": "au" }'