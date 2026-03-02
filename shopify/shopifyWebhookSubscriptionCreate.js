// https://shopify.dev/docs/api/admin-graphql/latest/mutations/webhookSubscriptionCreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id topic uri`;

const shopifyWebhookSubscriptionCreate = async (
  credsPath,
  topic,
  uri,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
    
    // direct API options
    format,
    includeFields,
    metafieldNamespaces,
    metafields,

  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'webhookSubscriptionCreate',
    {
      topic: {
        type: 'WebhookSubscriptionTopic!',
        value: topic,
      },
      webhookSubscription: {
        type: 'WebhookSubscriptionInput!',
        value: {
          uri,
          ...(format && { format }),
          ...(includeFields && { includeFields }),
          ...(metafieldNamespaces && { metafieldNamespaces }),
          ...(metafields && { metafields }),
        },
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

const shopifyWebhookSubscriptionCreateApi = funcApi(shopifyWebhookSubscriptionCreate, {
  argNames: ['credsPath', 'topic', 'uri', 'options'],
});

module.exports = {
  shopifyWebhookSubscriptionCreate,
  shopifyWebhookSubscriptionCreateApi,
};

// curl http://localhost:8000/shopifyWebhookSubscriptionCreate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "topic": "CUSTOMERS_UPDATE", "uri": "https://..." }'
// curl http://localhost:8000/shopifyWebhookSubscriptionCreate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "topic": "CUSTOMERS_UPDATE", "uri": "https://...", "options": { "format": "json", "includeFields": ["id", "note"], "metafields": [{ "namespace": "facts", "key": "date_of_birth" }] } }'