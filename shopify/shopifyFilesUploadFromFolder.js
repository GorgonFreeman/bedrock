const { funcApi, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const shopifyFilesUploadFromFolder = async (
  regions,
  folderPath,
  {
    apiVersion,
  } = {},
) => {

  const response = true;

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