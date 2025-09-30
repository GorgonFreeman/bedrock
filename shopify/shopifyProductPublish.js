// https://shopify.dev/docs/api/admin-graphql/latest/mutations/productPublish

const { funcApi, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const shopifyProductPublish = async (
  credsPath,
  productId,
  {
    apiVersion,
    publications, // https://shopify.dev/docs/api/admin-graphql/latest/input-objects/ProductPublicationInput
  } = {},
) => {
  return true;
};

const shopifyProductPublishApi = funcApi(shopifyProductPublish, {
  argNames: ['credsPath', 'productId', 'options'],
});

module.exports = {
  shopifyProductPublish,
  shopifyProductPublishApi,
};

// curl localhost:8000/shopifyProductPublish -H "Content-Type: application/json" -d '{ "credsPath": "au", "productId": "6981196546120" }'