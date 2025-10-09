const { funcApi, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id`;

const shopifyTagsPurge = async (
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

const shopifyTagsPurgeApi = funcApi(shopifyTagsPurge, {
  argNames: ['credsPath', 'arg', 'options'],
});

module.exports = {
  shopifyTagsPurge,
  shopifyTagsPurgeApi,
};

// curl localhost:8000/shopifyTagsPurge -H "Content-Type: application/json" -d '{ "credsPath": "au", "arg": "6979774283848" }'