// https://shopify.dev/docs/api/admin-graphql/latest/queries/giftCards

const { funcApi, logDeep } = require("../utils");
const { shopifyGet, shopifyGetter } = require("../shopify/shopify.utils");

const defaultAttrs = `id balance { amount currencyCode } customer { id email } enabled lastCharacters note templateSuffix expiresOn`;

const payloadMaker = (credsPath, { attrs = defaultAttrs, ...options } = {}) => [
  credsPath,
  "giftCard",
  {
    attrs,
    ...options,
  },
];

const shopifyGiftCardsGet = async (...args) => {
  const response = await shopifyGet(...payloadMaker(...args));
  return response;
};

const shopifyGiftCardsGetter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const shopifyGiftCardsGetApi = funcApi(shopifyGiftCardsGet, {
  argNames: ["credsPath", "options"],
});

module.exports = {
  shopifyGiftCardsGet,
  shopifyGiftCardsGetter,
  shopifyGiftCardsGetApi,
};

// curl localhost:8000/shopifyGiftCardsGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'

