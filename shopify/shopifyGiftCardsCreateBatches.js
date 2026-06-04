const { funcApi, actionMultipleOrSingle, objHasAll, countObjectsByValue } = require('../utils');
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
  const response = await actionMultipleOrSingle(
    batchPayload,
    shopifyGiftCardsCreateBatchesSingle,
    (batchPayload) => ({
      args: [credsPath, batchPayload],
      options,
    }),
  );

  if (!response.result) {
    return response;
  }

  const metadata = {
    // How many gift cards were created of each denomination
    createdCounts: countObjectsByValue(response.result.flat(), 'giftCard.initialValue.amount'),
  };

  return {
    ...response,
    metadata,
  };
};

const shopifyGiftCardsCreateBatchesApi = funcApi(shopifyGiftCardsCreateBatches, {
  argNames: [
    'credsPath', 
    'batchPayload', 
    'options', 
  ],
  validatorsByArg: {
    credsPath: Boolean,
    batchPayload: p => Array.isArray(p) ? p.every(item => objHasAll(item, ['denominationDecimal', 'quantity'])) : objHasAll(p, ['denominationDecimal', 'quantity']),
  },
});

module.exports = {
  shopifyGiftCardsCreateBatches,
  shopifyGiftCardsCreateBatchesApi,
};

// curl localhost:8000/shopifyGiftCardsCreateBatches -H "Content-Type: application/json" -d '{ "credsPath": "au", "batchPayload": { "denominationDecimal": 0.05, "quantity": 1 } }'
// curl localhost:8000/shopifyGiftCardsCreateBatches -H "Content-Type: application/json" -d '{ "credsPath": "au", "batchPayload": [{ "denominationDecimal": 0.05, "quantity": 1 }, { "denominationDecimal": 0.04, "quantity": 2 }] }'