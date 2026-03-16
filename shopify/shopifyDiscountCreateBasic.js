// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageCreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyDiscountCreateBasic = async (
  credsPath,
  discountInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'discountCodeBasicCreate',
    {
      automaticAppDiscount: {
        type: 'DiscountCodeBasicInput!',
        value: discountInput,
      },
    },
    `basicCodeDiscount { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyDiscountCreateBasicApi = funcApi(shopifyDiscountCreateBasic, {
  argNames: ['credsPath', 'pageInput', 'options'],
});

module.exports = {
  shopifyDiscountCreateBasic,
  shopifyDiscountCreateBasicApi,
};

// curl http://localhost:8000/shopifyDiscountCreateBasic -H 'Content-Type: application/json' -d '{ "credsPath": "au", "pageInput": { "title": "Batarang Blueprints", "body": "<strong>Good page!</strong>" }, "options": { "returnAttrs": "id" } }'