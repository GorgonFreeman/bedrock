// https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountRedeemCodeBulkAdd

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id codesCount importedCount`;

const shopifyDiscountRedeemCodeBulkAdd = async (
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
        value: `gid://shopify/Discount/${ discountId }`,
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

const shopifyDiscountRedeemCodeBulkAddApi = funcApi(shopifyDiscountRedeemCodeBulkAdd, {
  argNames: ['credsPath', 'discountId', 'codes', 'options'],
});

module.exports = {
  shopifyDiscountRedeemCodeBulkAdd,
  shopifyDiscountRedeemCodeBulkAddApi,
};

// curl http://localhost:8000/shopifyDiscountRedeemCodeBulkAdd -H 'Content-Type: application/json' -d '{ "credsPath": "au", "discountId": "1234567890", "codes": ["CODE1", "CODE2", "CODE3"] }'