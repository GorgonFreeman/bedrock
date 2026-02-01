// https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountRedeemCodeBulkAdd

const { funcApi, logDeep, arrayToChunks, actionMultipleOrSingle } = require('../utils');
const { MAX_PAYLOADS } = require('../shopify/shopify.constants');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id codesCount importedCount`;

const shopifyDiscountRedeemCodeBulkAddChunk = async (
  credsPath,
  discountId,
  codes,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'discountRedeemCodeBulkAdd',
    {
      discountId: {
        type: 'ID!',
        value: `gid://shopify/DiscountCodeNode/${ discountId }`,
      },
      codes: {
        type: '[DiscountRedeemCodeInput!]!',
        value: codes.map(code => ({ code })),
      },
    },
    `bulkCreation { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyDiscountRedeemCodeBulkAdd = async (
  credsPath,
  discountId,
  codes,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  // Chunk codes array by MAX_PAYLOADS
  const chunks = arrayToChunks(codes, MAX_PAYLOADS);

  const response = await actionMultipleOrSingle(
    chunks,
    shopifyDiscountRedeemCodeBulkAddChunk,
    (chunk) => ({
      args: [credsPath, discountId, chunk],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
}

const shopifyDiscountRedeemCodeBulkAddApi = funcApi(shopifyDiscountRedeemCodeBulkAdd, {
  argNames: ['credsPath', 'discountId', 'codes', 'options'],
});

module.exports = {
  shopifyDiscountRedeemCodeBulkAdd,
  shopifyDiscountRedeemCodeBulkAddApi,
};

// curl http://localhost:8000/shopifyDiscountRedeemCodeBulkAdd -H 'Content-Type: application/json' -d '{ "credsPath": "au", "discountId": "1234567890", "codes": ["CODE1", "CODE2", "CODE3"] }'