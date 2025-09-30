const { funcApi, logDeep } = require('../utils');
const { shopifyProductsGet } = require('../shopify/shopifyProductsGet');

const shopifyProductsPublish = async (
  credsPath,
  {
    apiVersion,
    fetchOptions,
  } = {},
) => {

  const attrs = `
    id
    unpublishedPublications(first: 20) {
      edges {
        node {
          id
          catalog {
            title
          }
        }
      }
    }
  `;

  const productsResponse = await shopifyProductsGet(
    credsPath,
    {
      apiVersion,
      ...fetchOptions,
      attrs,
    },
  );

  const { success: productsGetSuccess, result: productsData } = productsResponse;
  if (!productsGetSuccess) {
    return productsResponse;
  }

  logDeep(productsData);

  return true;
};

const shopifyProductsPublishApi = funcApi(shopifyProductsPublish, {
  argNames: ['credsPath'],
});

module.exports = {
  shopifyProductsPublish,
  shopifyProductsPublishApi,
};

// Publish online store products on all other channels
// curl localhost:8000/shopifyProductsPublish -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "fetchOptions": { "queries": ["publishable_status:published"] } } }'