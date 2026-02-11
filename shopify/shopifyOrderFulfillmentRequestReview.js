const { funcApi, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyOrderFulfillmentRequestReview = async (
  credsPath,
  arg,
  {
    apiVersion,
    option,
  } = {},
) => {

  const query = `
    query GetProduct($id: ID!) {
      product(id: $id) {
        ${ attrs }
      }
    }
  `;

  const variables = {
    id: `gid://shopify/Product/${ arg }`,
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query, variables },
    context: {
      credsPath,
      apiVersion,
    },
    interpreter: async (response) => {
      // console.log(response);
      return {
        ...response,
        ...response.result ? {
          result: response.result.product,
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const shopifyOrderFulfillmentRequestReviewApi = funcApi(shopifyOrderFulfillmentRequestReview, {
  argNames: ['credsPath', 'arg', 'options'],
});

module.exports = {
  shopifyOrderFulfillmentRequestReview,
  shopifyOrderFulfillmentRequestReviewApi,
};

// curl localhost:8000/shopifyOrderFulfillmentRequestReview -H "Content-Type: application/json" -d '{ "credsPath": "au", "arg": "6979774283848" }'