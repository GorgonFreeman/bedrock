const { funcApi, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyWebhookSubscriptionsDeleteInteractive = async (
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

const shopifyWebhookSubscriptionsDeleteInteractiveApi = funcApi(shopifyWebhookSubscriptionsDeleteInteractive, {
  argNames: ['credsPath', 'arg', 'options'],
});

module.exports = {
  shopifyWebhookSubscriptionsDeleteInteractive,
  shopifyWebhookSubscriptionsDeleteInteractiveApi,
};

// curl localhost:8000/shopifyWebhookSubscriptionsDeleteInteractive -H "Content-Type: application/json" -d '{ "credsPath": "au", "arg": "6979774283848" }'