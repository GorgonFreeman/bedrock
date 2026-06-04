const { funcApi, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyGiftCardsCreateBatches = async (
  credsPath,
  {
    denominationCents,
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

// curl localhost:8000/shopifyGiftCardsCreateBatches -H "Content-Type: application/json" -d '{ "credsPath": "auth", "giftCardPayload": { "denominationCents": 1000, "quantity": 1 } }'