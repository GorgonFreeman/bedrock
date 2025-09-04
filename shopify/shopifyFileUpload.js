const fs = require('fs').promises;
const path = require('path');
const mime = require('mime-types');
const { funcApi, logDeep, customAxios } = require('../utils');
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

  // 1. Get the filename from the local system
  const filename = path.basename(filepath);
  
  // 2. Check the MIME type
  const mimeType = mime.lookup(filepath);
  if (!mimeType) {
    throw new Error(`No MIME type for ${ filepath }`);
  }

  // 3. Check the file size
  const fileStats = await fs.stat(filepath);
  logDeep(fileStats);
  const { size: fileSize } = fileStats;

  // 4. Create staged upload url
  const stagedUploadResponse = await shopifyStagedUploadCreate(
    credsPath,
    resource,
    filename,
    mimeType,
    {
      apiVersion,
      fileSize: fileSize.toString(),
    },
  );

  const { success: stagedUploadSuccess, result: stagedUploadResult } = stagedUploadResponse;
  if (!stagedUploadSuccess) {
    return stagedUploadResponse;
  }

  const { stagedTargets } = stagedUploadResult;
  const stagedTarget = stagedTargets?.[0];

  if (!stagedTarget) {
    logDeep(stagedUploadResponse);
    return {
      success: false,
      error: ['No staged target found'],
    };
  }
  
  const { url, resourceUrl, parameters } = stagedTargets?.[0];
  
  // 5. Upload file to staged upload url
  const parametersAsObject = Object.fromEntries(parameters.map(p => {
    const { name, value } = p;
    return [name, value];
  }));

  const file = fs.createReadStream(filepath);

  const formData = formDataFromObject(parametersAsObject);
  formData.append('file', file);

  const fileUploadResponse = await customAxios('post', url, formData);
  logDeep(fileUploadResponse);

  const response = fileUploadResponse;

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