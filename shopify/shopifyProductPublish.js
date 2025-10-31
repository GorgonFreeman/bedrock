// https://shopify.dev/docs/api/admin-graphql/latest/mutations/productPublish

const { HOSTED } = require('../constants');
const { funcApi, logDeep, askQuestion, gidToId } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');
const { shopifyProductGet } = require('../shopify/shopifyProductGet');

const shopifyProductPublish = async (
  credsPath,
  productId,
  {
    apiVersion,
    publications, // https://shopify.dev/docs/api/admin-graphql/latest/input-objects/ProductPublicationInput
    publishExceptChannels = [ 'point_of_sale' ], // Channels to not publish to
    // TODO: Consider accepting an option to unpublish
  } = {},
) => {

  const exceptedChannelsToPublicationIds = {
    au: {
      point_of_sale: '41375891528',
    },
    us: {
      point_of_sale: '152743772220',
    },
    uk: {
      point_of_sale: '93497950282',
    },
  };

  const exceptedChannelMapping = exceptedChannelsToPublicationIds[credsPath] || {};
  const exceptedPublicationIds = Object.entries(exceptedChannelMapping)
    .filter(([channel, publicationId]) => publishExceptChannels.includes(channel))
    .map(([channel, publicationId]) => publicationId);

  if (!publications) {
    const productGetResponse = await shopifyProductGet(
      credsPath,
      { productId },
      {
        apiVersion,
        attrs: `
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
        `
      },
    );

    const { success: productGetSuccess, result: productData } = productGetResponse;
    if (!productGetSuccess) {
      return productGetResponse;
    }
    
    // logDeep(productData);
    // await askQuestion('?');
    publications = productData.unpublishedPublications
      .filter(p => !exceptedPublicationIds.includes(gidToId(p.id)))
      .map(p => ({ publicationId: p.id }))
    ;
  }

  // logDeep(publications);
  // await askQuestion('?');

  if (!publications?.length) {
    return {
      success: false,
      error: ['No publications to publish'],
    };
  }

  const response = await shopifyMutationDo(
    credsPath,
    'productPublish',
    {
      input: {
        type: 'ProductPublishInput!',
        value: {
          id: `gid://shopify/Product/${ productId }`,
          productPublications: publications,
        },
      },
    },
    `product { id title publishedAt }`,
    { 
      apiVersion,
    },
  );
  !HOSTED && logDeep(response);
  return response;
};

const shopifyProductPublishApi = funcApi(shopifyProductPublish, {
  argNames: ['credsPath', 'productId', 'options'],
});

module.exports = {
  shopifyProductPublish,
  shopifyProductPublishApi,
};

// curl localhost:8000/shopifyProductPublish -H "Content-Type: application/json" -d '{ "credsPath": "au", "productId": "6981196546120" }'