const { funcApi, logDeep } = require('../utils');
const { shopifyStagedUploadCreate } = require('../shopify/shopifyStagedUploadCreate');
const { shopifyFileCreate } = require('../shopify/shopifyFileCreate');

const shopifyFileUpload = async (
  credsPath,
  filepath,
  resource,
  {
    apiVersion,
    returnAttrs,
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

const shopifyFileUploadApi = funcApi(shopifyFileUpload, {
  argNames: ['credsPath', 'filepath', 'resource', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    filepath: Boolean,
    resource: Boolean,
  },
});

module.exports = {
  shopifyFileUpload,
  shopifyFileUploadApi,
};

// curl localhost:8000/shopifyFileUpload -H "Content-Type: application/json" -d '{ "credsPath": "au", "filepath": "/Users/darthvader/Downloads/lightsaber_warranty.pdf", "resource": "FILE" }'