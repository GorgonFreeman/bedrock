// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsdelete

const { funcApi, logDeep, objHasAll } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `key namespace`;

const shopifyMetafieldsDelete = async (
  credsPath,
  metafields,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const mutationName = 'metafieldsDelete';

  const response = await shopifyMutationDo(
    credsPath,
    mutationName,
    {
      metafields: {
        type: '[MetafieldIdentifierInput!]!',
        value: metafields,
      },
    },
    `deletedMetafields { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyMetafieldsDeleteApi = funcApi(shopifyMetafieldsDelete, {
  argNames: ['credsPath', 'metafields', 'options'],
  validatorsByArg: {
    metafields: p => objHasAll(p, ['ownerId', 'namespace', 'key']),
  },
});

module.exports = {
  shopifyMetafieldsDelete,
  shopifyMetafieldsDeleteApi,
};

// curl http://localhost:8000/shopifyMetafieldsDelete -H 'Content-Type: application/json' -d '{ "credsPath": "au", "metafields": [{ ... }, { ... }] }'