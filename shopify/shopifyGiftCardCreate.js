// https://shopify.dev/docs/api/admin-graphql/latest/mutations/giftCardCreate

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id initialValue { amount } customer { email }`;

const shopifyGiftCardCreateSingle = async (
  credsPath,
  initialValueDecimal,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
    
    // API options
    code,
    customerId,
    expiresOn,
    note,
    recipientAttributes,
    templateSuffix,
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
          ...(code && { code }),
          ...(customerId && { customerId }),
          ...(expiresOn && { expiresOn }),
          ...(note && { note }),
          ...(recipientAttributes && { recipientAttributes }),
          ...(templateSuffix && { templateSuffix }),
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
  return response;
};

const shopifyGiftCardCreate = async (
  credsPath,
  initialValueDecimal,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    initialValueDecimal,
    shopifyGiftCardCreateSingle,
    (initialValueDecimal) => ({
      args: [credsPath, initialValueDecimal],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  logDeep(response);
  return response;
};

const shopifyGiftCardCreateApi = funcApi(shopifyGiftCardCreate, {
  argNames: ['credsPath', 'initialValueDecimal', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    initialValueDecimal: p => (Array.isArray(p) ? p.every(v => parseFloat(v) > 0) : parseFloat(p) > 0),
  },
});

module.exports = {
  shopifyGiftCardCreate,
  shopifyGiftCardCreateSingle,
  shopifyGiftCardCreateApi,
};

// curl http://localhost:8000/shopifyGiftCardCreate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "initialValueDecimal": "0.05" }'
