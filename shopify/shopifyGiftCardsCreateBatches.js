const { funcApi, actionMultipleOrSingle, objHasAll } = require('../utils');
const { shopifyGiftCardCreate } = require('../shopify/shopifyGiftCardCreate');

const defaultAttrs = `initialValue { amount }`;

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

  giftCardCreateOptions.returnAttrs = giftCardCreateOptions?.returnAttrs || defaultAttrs;

  const createResponse = await shopifyGiftCardCreate(
    credsPath, 
    [...Array(quantity).fill(denominationDecimal)], 
    {
      ...giftCardCreateOptions,
      apiVersion,
    },
  );

  if (!createResponse.success) {
    return createResponse;
  }

  return createResponse;
};

const shopifyGiftCardsCreateBatches = async (
  credsPath,
  batchPayload,
  options = {},
) => {
  const { quantity } = batchPayload;

  return actionMultipleOrSingle(
    Array.from({ length: quantity }),
    shopifyGiftCardsCreateBatchesSingle,
    () => ({
      args: [credsPath, batchPayload],
      options,
    }),
  );
};

const shopifyGiftCardsCreateBatchesApi = funcApi(shopifyGiftCardsCreateBatches, {
  argNames: [
    'credsPath', 
    'batchPayload', 
    'options', 
  ],
  validatorsByArg: {
    credsPath: Boolean,
    batchPayload: p => objHasAll(p, ['denominationDecimal', 'quantity']),
  },
});

module.exports = {
  shopifyGiftCardsCreateBatches,
  shopifyGiftCardsCreateBatchesApi,
};

// curl localhost:8000/shopifyGiftCardsCreateBatches -H "Content-Type: application/json" -d '{ "credsPath": "au", "batchPayload": { "denominationDecimal": 0.05, "quantity": 1 } }'