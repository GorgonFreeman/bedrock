// https://shopify.dev/docs/api/admin-graphql/latest/mutations/giftCardCreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id initialValue { amount } customer { email }`;

const shopifyGiftCardCreate = async (
  credsPath,
  initialValueDecimal,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'giftCardCreate',
    {
      input: {
        type: 'GiftCardCreateInput!',
        value: {
          initialValue: initialValueDecimal,
        },
      },
    },
    `
      giftCardCode
      giftCard { ${ returnAttrs } } 
    `,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyGiftCardCreateApi = funcApi(shopifyGiftCardCreate, {
  argNames: ['credsPath', 'initialValueDecimal', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    initialValueDecimal: p => (parseFloat(p) > 0),
  },
});

module.exports = {
  shopifyGiftCardCreate,
  shopifyGiftCardCreateApi,
};

// curl http://localhost:8000/shopifyGiftCardCreate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "initialValueDecimal": "0.05" }'