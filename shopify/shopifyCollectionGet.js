// https://shopify.dev/docs/api/admin-graphql/latest/queries/collection
// https://shopify.dev/docs/api/admin-graphql/latest/queries/collectionbyidentifier

const { funcApi, logDeep, objHasAny } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyCollectionGet = async (
  credsPath,
  {
    collectionId,
    customId,
    handle,
  },
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  if (!collectionId) {

    const query = `
      query GetCollectionByIdentifier($identifier: CollectionIdentifierInput!) {
        collection: collectionByIdentifier(identifier: $identifier) {
          ${ attrs }
        }
      }
    `;
    const variables = {
      identifier: {
        ...customId && { customId },
        ...handle && { handle },
      },
    };
    const response = await shopifyClient.fetch({
      method: 'post',
      body: { query, variables },
      context: {
        credsPath,
        apiVersion,
      },
      interpreter: async (response) => {
        return {
          ...response,
          ...response.result ? {
            result: response.result.collection,
          } : {},
        };
      },
    });

    return response;
  }

  const response = await shopifyGetSingle(
    credsPath,
    'collection',
    collectionId,
    {
      apiVersion,
      attrs,
    },
  );

  return response;
};

const shopifyCollectionGetApi = funcApi(shopifyCollectionGet, {
  argNames: ['credsPath', 'collectionIdentifier', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    collectionIdentifier: p => objHasAny(p, ['collectionId', 'customId', 'handle']),
  },
});

module.exports = {
  shopifyCollectionGet,
  shopifyCollectionGetApi,
};

// curl localhost:8000/shopifyCollectionGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "collectionIdentifier": { "collectionId": "7012222266312" } }'
// curl localhost:8000/shopifyCollectionGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "collectionIdentifier": { "handle": "discountable" } }'
// curl localhost:8000/shopifyCollectionGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "collectionIdentifier": { "customId": "1234567890" } }'