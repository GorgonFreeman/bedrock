const { funcApi, logDeep, Processor, gidToId, arrayStandardResponse, askQuestion } = require('../utils');
const { shopifyProductsGet } = require('../shopify/shopifyProductsGet');
const { shopifyProductPublish } = require('../shopify/shopifyProductPublish');

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

  const { success: productsGetSuccess, result: products } = productsResponse;
  if (!productsGetSuccess) {
    return productsResponse;
  }

  const results = [];

  const publishingProcessor = new Processor(
    products, 
    async (pile) => {
      const product = pile.shift();

      logDeep(product);
      await askQuestion('Continue?');

      const { 
        id: productGid, 
        unpublishedPublications, 
      } = product;
      const publicationsInput = unpublishedPublications.map(p => ({ publicationId: p.id }));
      const productId = gidToId(productGid);

      const publishResponse = await shopifyProductPublish(
        credsPath, 
        productId,
        {
          apiVersion,
          publications: publicationsInput,
        },
      );

      results.push(publishResponse);
    },
    pile => pile.length === 0,
    {
      // runOptions: {
      //   interval: 20,
      // },
    },
  );

  await publishingProcessor.run();

  const response = arrayStandardResponse(results);
  logDeep(response);
  return response;
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