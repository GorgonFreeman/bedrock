// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metaobjectCreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id handle displayName`;

const shopifyMetaobjectCreate = async (
  credsPath,
  metaobjectInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'metaobjectCreate',
    {
      metaobject: {
        type: 'MetaobjectCreateInput!',
        value: metaobjectInput,
      },
    },
    `metaobject { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyMetaobjectCreateApi = funcApi(shopifyMetaobjectCreate, {
  argNames: ['credsPath', 'metaobjectInput'],
});

module.exports = {
  shopifyMetaobjectCreate,
  shopifyMetaobjectCreateApi,
};

// curl http://localhost:8000/shopifyMetaobjectCreate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "metaobjectInput": { "type": "wishlist_emojis", "handle": "happy-face", "fields": [ { "key": "emoji", "value": "😊" }, { "key": "description", "value": "A happy face emoji" } ] }, "options": { "returnAttrs": "id handle displayName" } }'