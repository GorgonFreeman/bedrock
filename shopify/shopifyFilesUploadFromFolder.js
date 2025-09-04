const { funcApi, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const shopifyFilesUploadFromFolder = async (
  regions,
  folderPath,
  {
    apiVersion,
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

const shopifyFilesUploadFromFolderApi = funcApi(shopifyFilesUploadFromFolder, {
  argNames: ['regions', 'folderPath', 'options'],
  validatorsByArg: {
    regions: Array.isArray,
    folderPath: Boolean,
  },
});

module.exports = {
  shopifyFilesUploadFromFolder,
  shopifyFilesUploadFromFolderApi,
};

// curl localhost:8000/shopifyFilesUploadFromFolder -H "Content-Type: application/json" -d '{ "regions": ["au"], "folderPath": "/Users/armstrong/Desktop/nanobots" }'