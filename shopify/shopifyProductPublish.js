// https://shopify.dev/docs/api/admin-graphql/latest/mutations/productPublish

const { funcApi, logDeep, askQuestion } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');
const { shopifyProductGet } = require('../shopify/shopifyProductGet');

const shopifyProductPublish = async (
  credsPath,
  productId,
  {
    apiVersion,
    publications, // https://shopify.dev/docs/api/admin-graphql/latest/input-objects/ProductPublicationInput
    // TODO: Consider accepting an option to unpublish
  } = {},
) => {

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
    
    logDeep(productData);
    await askQuestion('?');
    publications = productData.unpublishedPublications
      .map(p => ({ publicationId: p.id }))
    ;
  }

  logDeep(publications);
  await askQuestion('?');

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
    `product { publishedAt }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
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