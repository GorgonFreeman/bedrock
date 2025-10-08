// https://shopify.dev/docs/api/admin-graphql/latest/queries/giftCard

const { funcApi, logDeep } = require("../utils");
const { shopifyGetSingle } = require("../shopify/shopifyGetSingle");

const defaultAttrs = `id balance { amount currencyCode } customer { id email } enabled lastCharacters note templateSuffix expiresOn`;

const shopifyGiftCardGet = async (credsPath, giftCardIdentifier, { attrs = defaultAttrs, apiVersion } = {}) => {
  const { giftCardId } = giftCardIdentifier;

  const response = await shopifyGetSingle(credsPath, "giftCard", giftCardId, {
    apiVersion,
    attrs,
  });

  logDeep(response);
  return response;
};

const shopifyGiftCardGetApi = funcApi(shopifyGiftCardGet, {
  argNames: [
    "credsPath",
    "giftCardIdentifier",
    "options",
  ],
});

module.exports = {
  shopifyGiftCardGet,
  shopifyGiftCardGetApi,
};

// curl localhost:8000/shopifyGiftCardGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "giftCardIdentifier": { "giftCardId": "7012222266312" } }'
