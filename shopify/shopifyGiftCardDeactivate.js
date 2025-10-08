// https://shopify.dev/docs/api/admin-graphql/latest/mutations/giftCardDeactivate

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `enabled deactivatedAt`;

const shopifyGiftCardDeactivateSingle = async (
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
  
  return response;
};

const shopifyGiftCardDeactivate = async (
  credsPath,
  giftCardId,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    giftCardId,
    shopifyGiftCardDeactivateSingle,
    (giftCardId) => ({
      args: [credsPath, giftCardId],
      options: { apiVersion, returnAttrs },
    }),
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
// curl http://localhost:8000/shopifyGiftCardDeactivate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "giftCardId": [630309617736, 630309617737] }'