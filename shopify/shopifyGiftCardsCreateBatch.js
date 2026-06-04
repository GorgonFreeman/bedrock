const { funcApi, actionMultipleOrSingle, objHasAll, countObjectsByValue } = require('../utils');
const { shopifyGiftCardCreate } = require('../shopify/shopifyGiftCardCreate');

// TODO: Migrate to bulk operations

const defaultAttrs = `initialValue { amount }`;

const shopifyGiftCardsCreateBatchSingle = async (
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

const shopifyGiftCardsCreateBatch = async (
  credsPath,
  batchPayload,
  options = {},
) => {
  const response = await actionMultipleOrSingle(
    batchPayload,
    shopifyGiftCardsCreateBatchSingle,
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

const shopifyGiftCardsCreateBatchApi = funcApi(shopifyGiftCardsCreateBatch, {
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
  shopifyGiftCardsCreateBatch,
  shopifyGiftCardsCreateBatchApi,
};

// curl localhost:8000/shopifyGiftCardsCreateBatch -H "Content-Type: application/json" -d '{ "credsPath": "au", "batchPayload": { "denominationDecimal": 0.05, "quantity": 1 } }'
// curl localhost:8000/shopifyGiftCardsCreateBatch -H "Content-Type: application/json" -d '{ "credsPath": "au", "batchPayload": [{ "denominationDecimal": 0.05, "quantity": 1 }, { "denominationDecimal": 0.04, "quantity": 2 }] }'
