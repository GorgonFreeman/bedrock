// https://shopify.dev/docs/api/admin-graphql/latest/queries/webhooksubscriptions

const { funcApi, logDeep } = require('../utils');
const { shopifyGet, shopifyGetter } = require('../shopify/shopify.utils');

const defaultAttrs = `id topic uri`;

const payloadMaker = (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => {
  return [
    credsPath, 
    'webhookSubscription',
    { 
      attrs, 
      ...options,
    },
  ];
};

const shopifyWebhookSubscriptionsGet = async (...args) => {
  const response = await shopifyGet(...payloadMaker(...args));
  return response;
};

const shopifyWebhookSubscriptionsGetter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const shopifyWebhookSubscriptionsGetApi = funcApi(shopifyWebhookSubscriptionsGet, {
  argNames: ['credsPath', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
  },
});

module.exports = {
  shopifyWebhookSubscriptionsGet,
  shopifyWebhookSubscriptionsGetter,
  shopifyWebhookSubscriptionsGetApi,
};

// curl localhost:8000/shopifyWebhookSubscriptionsGet -H "Content-Type: application/json" -d '{ "credsPath": "au" }'