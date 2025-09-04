// https://shopify.dev/docs/api/admin-graphql/latest/mutations/stageduploadscreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `url resourceUrl parameters { name value }`;

const shopifyStagedUploadCreate = async (
  credsPath,
  resource,
  filename,
  mimeType,
  {
    apiVersion,
    returnAttrs = defaultAttrs,

    fileSize,
    httpMethod,
  } = {},
) => {

  const mutationName = 'stagedUploadsCreate';

  const mutationVariables = {
    input: {
      type: '[StagedUploadInput!]!',
      value: [{
        resource,
        filename,
        mimeType,
        ...(fileSize && { fileSize }),
        ...(httpMethod && { httpMethod }),
      }],
    },
  };

  const response = await shopifyMutationDo(
    credsPath,
    mutationName,
    mutationVariables,
    `stagedTargets { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyStagedUploadCreateApi = funcApi(shopifyStagedUploadCreate, {
  argNames: ['credsPath', 'resource', 'filename', 'mimeType', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    resource: Boolean,
    filename: Boolean,
    mimeType: Boolean,
  },
});

module.exports = {
  shopifyStagedUploadCreate,
  shopifyStagedUploadCreateApi,
};

// curl http://localhost:8000/shopifyStagedUploadCreate -H "Content-Type: application/json" -d '{ "credsPath": "au", "resource": "FILE", "filename": "deepfried_shrek.jpg", "mimeType": "image/jpeg" }'