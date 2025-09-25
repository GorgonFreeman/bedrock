// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageCreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyMetaobjectCreate = async (
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

const shopifyMetaobjectCreateApi = funcApi(shopifyMetaobjectCreate, {
  argNames: ['credsPath', 'pageInput'],
});

module.exports = {
  shopifyMetaobjectCreate,
  shopifyMetaobjectCreateApi,
};

// curl http://localhost:8000/shopifyMetaobjectCreate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "pageInput": { "title": "Batarang Blueprints", "body": "<strong>Good page!</strong>" }, "options": { "returnAttrs": "id" } }'