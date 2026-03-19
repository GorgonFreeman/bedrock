// https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountCodeBasicCreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `title codes(first: 10) { nodes { code } }`;

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
      basicCodeDiscount: {
        type: 'DiscountCodeBasicInput!',
        value: discountInput,
      },
    },
    `codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            ${ returnAttrs }
          }
        }
      }`,
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