// https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountAutomaticAppCreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `discountId title status`;

const shopifyAppDiscountCreateAutomatic = async (
  credsPath,
  discountInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'discountAutomaticAppCreate',
    {
      automaticAppDiscount: {
        type: 'DiscountAutomaticAppInput!',
        value: discountInput,
      },
    },
    `automaticAppDiscount { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyAppDiscountCreateAutomaticApi = funcApi(shopifyAppDiscountCreateAutomatic, {
  argNames: ['credsPath', 'automaticAppDiscountInput'],
});

module.exports = {
  shopifyAppDiscountCreateAutomatic,
  shopifyAppDiscountCreateAutomaticApi,
};

// curl http://localhost:8000/shopifyAppDiscountCreateAutomatic -H 'Content-Type: application/json' -d '{ "credsPath": "au", "automaticAppDiscountInput": { "title": "40% Off Cheapest Item from Collection", "functionHandle": "discount-buy-x-get-40-y-custom", "startsAt": "2025-12-01T00:00:00Z", "endsAt": null, "combinesWith": { "orderDiscounts": false, "productDiscounts": false, "shippingDiscounts": false }, "metafields": [{ "namespace": "default", "key": "function-configuration", "type": "json", "value": "{\"discounts\":[{\"value\":{\"percentage\":{\"value\":\"40.0\"}},\"targets\":[{\"cartLine\":{\"id\":null,\"quantity\":null}}]}],\"discountApplicationStrategy\":\"FIRST\"}" }] }, "options": { "returnAttrs": "discountId title status startsAt endsAt" } }'