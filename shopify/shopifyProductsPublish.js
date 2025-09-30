const { funcApi, logDeep } = require('../utils');
const { shopifyProductsGet } = require('../shopify/shopifyProductsGet');

const shopifyProductsPublish = async (
  credsPath,
  {
    apiVersion,
    fetchOptions,
  } = {},
) => {

  return true;
};

const shopifyProductsPublishApi = funcApi(shopifyProductsPublish, {
  argNames: ['credsPath'],
});

module.exports = {
  shopifyProductsPublish,
  shopifyProductsPublishApi,
};

// curl localhost:8000/shopifyProductsPublish -H "Content-Type: application/json" -d '{ "credsPath": "au" }'