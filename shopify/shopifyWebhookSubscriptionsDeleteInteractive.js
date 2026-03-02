const { funcApi, logDeep, interactiveChooseMultiple, gidToId, actionMultipleOrSingle } = require('../utils');

const { shopifyWebhookSubscriptionsGet } = require('../shopify/shopifyWebhookSubscriptionsGet');
const { shopifyWebhookSubscriptionDelete } = require('../shopify/shopifyWebhookSubscriptionDelete');

const shopifyWebhookSubscriptionsDeleteInteractiveSingle = async (
  credsPath,
  {
    apiVersion,
  } = {},
) => {

  const shopifyWebhookSubscriptionsResponse = await shopifyWebhookSubscriptionsGet(credsPath, {
    apiVersion,
    attrs: 'id topic uri',
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
      nameNode: 'uri',
    },
  );

  logDeep('subscriptionsToDelete', subscriptionsToDelete);

  if (!subscriptionsToDelete?.length) {
    return { 
      success: true, 
      result: {
        message: 'No subscriptions chosen',
      } 
    };
  }

  const deleteResponse = await shopifyWebhookSubscriptionDelete(
    credsPath, 
    subscriptionsToDelete.map(({ id: subGid }) => gidToId(subGid)), 
    { 
      apiVersion,
    },
  );

  return deleteResponse;
};

const shopifyWebhookSubscriptionsDeleteInteractive = async (
  credsPath,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  return actionMultipleOrSingle(
    credsPath,
    shopifyWebhookSubscriptionsDeleteInteractiveSingle,
    (credsPath) => ({
      args: [credsPath],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const shopifyWebhookSubscriptionsDeleteInteractiveApi = funcApi(shopifyWebhookSubscriptionsDeleteInteractive, {
  argNames: ['credsPath', 'options'],
});

module.exports = {
  shopifyWebhookSubscriptionsDeleteInteractive,
  shopifyWebhookSubscriptionsDeleteInteractiveApi,
};

// curl localhost:8000/shopifyWebhookSubscriptionsDeleteInteractive -H "Content-Type: application/json" -d '{ "credsPath": "au" }'
// curl localhost:8000/shopifyWebhookSubscriptionsDeleteInteractive -H "Content-Type: application/json" -d '{ "credsPath": ["au", "us", "uk"] }'