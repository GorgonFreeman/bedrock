const { funcApi, logDeep, Processor, gidToId, arrayStandardResponse, askQuestion, actionMultipleOrSingle } = require('../utils');
const { shopifyProductsGetter } = require('../shopify/shopifyProductsGet');
const { shopifyProductPublish } = require('../shopify/shopifyProductPublish');

const shopifyProductsPublishSingle = async (
  credsPath,
  {
    apiVersion,
    fetchOptions,
  } = {},
) => {

  const piles = {
    products: [],
    results: [],
  };

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

  const productsGetter = await shopifyProductsGetter(
    credsPath,
    {
      apiVersion,
      ...fetchOptions,
      attrs,

      onItems: (items) => {
        piles.products.push(...items);
      },
    },
  );

  const publishingProcessor = new Processor(
    piles.products, 
    async (pile) => {
      const product = pile.shift();

      const { 
        id: productGid, 
        unpublishedPublications, 
      } = product;

      if (unpublishedPublications.length === 0) {
        return;
      }

      // logDeep(product);
      // await askQuestion('Continue?');

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

      piles.results.push(publishResponse);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      runOptions: {
        interval: 20,
      },
    },
  );

  productsGetter.on('done', () => {
    publishingProcessor.canFinish = true;
  });
 
  await Promise.all([
    productsGetter.run(),
    publishingProcessor.run(),
  ]);

  const response = arrayStandardResponse(piles.results);
  logDeep(response);
  return response;
};

const shopifyProductsPublish = async (
  credsPath,
  {
    queueRunOptions = { interval: 1 },
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    credsPath,
    shopifyProductsPublishSingle,
    (credsPath) => ({
      args: [credsPath],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyProductsPublishApi = funcApi(shopifyProductsPublish, {
  argNames: ['credsPath', 'options'],
});

module.exports = {
  shopifyProductsPublish,
  shopifyProductsPublishSingle,
  shopifyProductsPublishApi,
};

// Publish online store products on all other channels
// curl localhost:8000/shopifyProductsPublish -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "fetchOptions": { "queries": ["published_status:published"] } } }'
// curl localhost:8000/shopifyProductsPublish -H "Content-Type: application/json" -d '{ "credsPath": ["au", "us", "uk"], "options": { "fetchOptions": { "queries": ["published_status:published"] } } }'