// https://shopify.dev/docs/api/admin-graphql/latest/queries/orders

const { funcApi, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const defaultAttrs = `id name`;

const shopifyDeliveryProfilesGet = async (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => {

  const response = await shopifyGet(
    credsPath, 
    'order', 
    {
      attrs,
      ...options,
    },
  );

  return response;
};

const shopifyDeliveryProfilesGetApi = funcApi(shopifyDeliveryProfilesGet, {
  argNames: ['credsPath', 'options'],
});

module.exports = {
  shopifyDeliveryProfilesGet,
  shopifyDeliveryProfilesGetApi,
};

// curl localhost:8000/shopifyDeliveryProfilesGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'