const fs = require('fs').promises;
const mime = require('mime-types');
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

  // 1. Get the file from the local system
  const file = await fs.readFile(filepath);
  
  // 2. Check the MIME type
  const mimeType = mime.lookup(filepath);
  if (!mimeType) {
    throw new Error(`No MIME type for ${ filepath }`);
  }

  // 3. Check the file size
  const fileStats = await fs.stat(filepath);
  logDeep(fileStats);
  const { size: fileSize } = fileStats;

  const response = true;

  logDeep(response);
  return response;
};

const shopifyFileUploadApi = funcApi(shopifyFileUpload, {  argNames: ['credsPath', 'filepath', 'resource', 'options'],
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