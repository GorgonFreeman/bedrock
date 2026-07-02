// https://shopify.dev/docs/api/admin-graphql/latest/mutations/productUnpublish

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');
const { shopifyProductGet } = require('../shopify/shopifyProductGet');

const shopifyProductUnpublish = async (
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
          resourcePublicationsV2(first: 20) {
            edges {
              node {
                publication {
                  id
                  catalog {
                    title
                  }
                }
              }
            }
          }
        `,
      },
    );
    const { success: productGetSuccess, result: productData } = productGetResponse;
    if (!productGetSuccess) {
      return productGetResponse;
    }

    publications = productData.resourcePublicationsV2.edges.map(edge => ({ publicationId: edge.node.publication.id }));
  }

};

const shopifyProductUnpublishApi = funcApi(shopifyProductUnpublish, {
  argNames: ['credsPath', 'productId', 'options'],
});

module.exports = {
  shopifyProductUnpublish,
  shopifyProductUnpublishApi,
};

// curl http://localhost:8000/shopifyProductUnpublish -H 'Content-Type: application/json' -d '{ "credsPath": "au", "productId": "7077149507656" }'
// curl http://localhost:8000/shopifyProductUnpublish -H 'Content-Type: application/json' -d '{ "credsPath": "au", "productId": "7077149507656", "publications": [ { "publicationId": "gid://shopify/Publication/1234567890" } ] }'