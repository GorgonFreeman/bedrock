// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageCreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyGiftCardDisable = async (
  credsPath,
  giftCardId,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'pageCreate',
    {
      page: {
        type: 'PageCreateInput!',
        value: giftCardId,
      },
    },
    `page { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyGiftCardDisableApi = funcApi(shopifyGiftCardDisable, {
  argNames: ['credsPath', 'giftCardId', 'options'],
});

module.exports = {
  shopifyGiftCardDisable,
  shopifyGiftCardDisableApi,
};

// curl http://localhost:8000/shopifyGiftCardDisable -H 'Content-Type: application/json' -d '{ "credsPath": "au", "giftCardId": { "title": "Batarang Blueprints", "body": "<strong>Good page!</strong>" }, "options": { "returnAttrs": "id" } }'