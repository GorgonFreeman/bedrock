// https://shopify.dev/docs/api/admin-graphql/latest/mutations/filecreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id fileStatus fileErrors { code details message }`;

const shopifyFileCreate = async (
  credsPath,
  {
    filename,
    originalSource,
    contentType,
    alt,
    duplicateResolutionMode,
  },
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const mutationName = 'fileCreate';
  const mutationVariables = {
    files: {
      type: '[FileCreateInput!]!',
      value: [{
        ...(filename && { filename }),
        originalSource,
        ...(contentType && { contentType }),
        ...(alt && { alt }),
        ...(duplicateResolutionMode && { duplicateResolutionMode }),
      }],
    },
  };

  const response = await shopifyMutationDo(
    credsPath,
    mutationName,
    mutationVariables,
    `files { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyFileCreateApi = funcApi(shopifyFileCreate, {
  argNames: ['credsPath', 'fileInput', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
    fileInput: p => p?.originalSource, // Only required field as far as I can tell
  },
});

module.exports = {
  shopifyFileCreate,
  shopifyFileCreateApi,
};

// curl http://localhost:8000/shopifyFileCreate -H "Content-Type: application/json" -d '{ "credsPath": "au", "fileInput": { "originalSource": "https://upload.wikimedia.org/wikipedia/en/5/5f/Original_Doge_meme.jpg" } }'