// https://shopify.dev/docs/api/admin-graphql/latest/mutations/giftCardDeactivate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `enabled deactivatedAt`;

const shopifyGiftCardDeactivate = async (
  credsPath,
  giftCardId,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'giftCardDeactivate',
    {
      id: {
        type: 'ID!',
        value: `gid://shopify/GiftCard/${ giftCardId }`,
      },
    },
    `giftCard { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyGiftCardDeactivateApi = funcApi(shopifyGiftCardDeactivate, {
  argNames: ['credsPath', 'giftCardId'],
});

module.exports = {
  shopifyGiftCardDeactivate,
  shopifyGiftCardDeactivateApi,
};

// curl http://localhost:8000/shopifyGiftCardDeactivate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "giftCardId": 630309617736 }'