// https://shopify.dev/docs/api/admin-graphql/latest/mutations/productPublish

const { funcApi, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');
const { shopifyProductGet } = require('../shopify/shopifyProductGet');

const shopifyProductPublish = async (
  credsPath,
  productId,
  {
    apiVersion,
    publications, // https://shopify.dev/docs/api/admin-graphql/latest/input-objects/ProductPublicationInput
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
          resourcePublications(first: 20) {
            edges {
              node {
                isPublished
                publishDate
                publication {
                  id
                  catalog {
                    title
                  }
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

    publications = productData.publications;
  }

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