// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsSet

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyMetafieldsSet = async (
  credsPath,
  pageInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'pageCreate',
    {
      page: {
        type: 'PageCreateInput!',
        value: pageInput,
      },
    },
    `page { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyMetafieldsSetApi = funcApi(shopifyMetafieldsSet, {
  argNames: ['credsPath', 'pageInput', 'options'],
});

module.exports = {
  shopifyMetafieldsSet,
  shopifyMetafieldsSetApi,
};

// curl http://localhost:8000/shopifyMetafieldsSet -H 'Content-Type: application/json' -d '{ "credsPath": "au", "pageInput": { "title": "Batarang Blueprints", "body": "<strong>Good page!</strong>" }, "options": { "returnAttrs": "id" } }'