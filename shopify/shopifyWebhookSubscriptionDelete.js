// https://shopify.dev/docs/api/admin-graphql/latest/mutations/webhookSubscriptionDelete

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const shopifyWebhookSubscriptionDelete = async (
  credsPath,
  subscriptionId,
  {
    apiVersion,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'webhookSubscriptionDelete',
    {
      id: {
        type: 'ID!',
        value: `gid://shopify/WebhookSubscription/${ subscriptionId }`,
      },
    },
    `deletedWebhookSubscriptionId`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyWebhookSubscriptionDeleteApi = funcApi(shopifyWebhookSubscriptionDelete, {
  argNames: ['credsPath', 'subscriptionId', 'options'],
});

module.exports = {
  shopifyWebhookSubscriptionDelete,
  shopifyWebhookSubscriptionDeleteApi,
};

// curl http://localhost:8000/shopifyWebhookSubscriptionDelete -H 'Content-Type: application/json' -d '{ "credsPath": "au", "subscriptionId": "1179140456520" }'