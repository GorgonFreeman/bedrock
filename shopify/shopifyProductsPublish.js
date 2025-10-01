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
    actionable: [],
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
      logFlavourText: `Getting items on ${ credsPath }`,
    },
  );

  const qualifyingProcessor = new Processor(
    piles.products,
    async (pile) => {
      const product = pile.shift();
      if (product.unpublishedPublications.length > 0) {
        piles.actionable.push(product);
      }
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: `Qualifying ${ credsPath }`,
    },
  );

  const publishingProcessor = new Processor(
    piles.actionable, 
    async (pile) => {
      const product = pile.shift();

      const { 
        id: productGid, 
        unpublishedPublications, 
      } = product;

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
      maxInFlightRequests: 50,
      logFlavourText: `Publishing ${ credsPath }`,
    },
  );

  productsGetter.on('done', () => {
    qualifyingProcessor.canFinish = true;
  });

  qualifyingProcessor.on('done', () => {
    publishingProcessor.canFinish = true;
  });
 
  await Promise.all([
    productsGetter.run(),
    qualifyingProcessor.run({ verbose: false }),
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
// curl localhost:8000/shopifyProductsPublish -H "Content-Type: application/json" -d '{ "credsPath": ["au.publish_sweep", "us.publish_sweep", "uk.publish_sweep"], "options": { "fetchOptions": { "queries": ["published_status:published"] } } }'