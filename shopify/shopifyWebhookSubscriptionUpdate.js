// https://shopify.dev/docs/api/admin-graphql/latest/mutations/webhookSubscriptionUpdate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id topic uri`;

const shopifyWebhookSubscriptionUpdate = async (
  credsPath,
  subscriptionId,
  updatePayload,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'webhookSubscriptionUpdate',
    {
      id: {
        type: 'ID!',
        value: `gid://shopify/WebhookSubscription/${ subscriptionId }`,
      },
      webhookSubscription: {
        type: 'WebhookSubscriptionInput!',
        value: updatePayload,
      },
    },
    `webhookSubscription { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyWebhookSubscriptionUpdateApi = funcApi(shopifyWebhookSubscriptionUpdate, {
  argNames: ['credsPath', 'subscriptionId', 'updatePayload', 'options'],
});

module.exports = {
  shopifyWebhookSubscriptionUpdate,
  shopifyWebhookSubscriptionUpdateApi,
};

// Note: It seems like you have to specify metafields AND metafieldNamespaces AND include "metafields" in the includedFields to get the metafield in the payload. TODO: Confirm.
// curl http://localhost:8000/shopifyWebhookSubscriptionUpdate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "subscriptionId": "1179149303880", "updatePayload": { "metafieldNamespaces": ["facts"], "metafields": [{ "namespace": "facts", "key": "birth_date" }], "includeFields": ["id", "note", "metafields"] } }'