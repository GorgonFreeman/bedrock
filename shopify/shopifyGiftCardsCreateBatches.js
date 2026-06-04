const { funcApi, actionMultipleOrSingle } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyGiftCardsCreateBatchesSingle = async (
  credsPath,
  {
    denominationDecimal,
    quantity,
    giftCardCreateOptions = {},
  },
  {
    apiVersion,
  } = {},
) => {

  return {
    success: true,
  };
};

const shopifyGiftCardsCreateBatches = async (
  credsPath,
  giftCardPayload,
  options = {},
) => {
  const { quantity } = giftCardPayload;

  return actionMultipleOrSingle(
    Array.from({ length: quantity }),
    shopifyGiftCardsCreateBatchesSingle,
    () => ({
      args: [credsPath, giftCardPayload],
      options,
    }),
  );
};

const shopifyGiftCardsCreateBatchesApi = funcApi(shopifyGiftCardsCreateBatches, {
  argNames: [
    'credsPath', 
    'giftCardPayload', 
    'options', 
  ],
  validatorsByArg: {
    credsPath: Boolean,
    giftCardPayload: Boolean,
  },
});

module.exports = {
  shopifyGiftCardsCreateBatches,
  shopifyGiftCardsCreateBatchesApi,
};

// curl localhost:8000/shopifyGiftCardsCreateBatches -H "Content-Type: application/json" -d '{ "credsPath": "auth", "giftCardPayload": { "denominationDecimal": 1000, "quantity": 1 } }'