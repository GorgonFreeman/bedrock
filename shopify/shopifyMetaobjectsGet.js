// https://shopify.dev/docs/api/admin-graphql/latest/queries/metaobjects

const { funcApi, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const defaultAttrs = `id handle displayName`;

const shopifyMetaobjectsGet = async (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => {

  const response = await shopifyGet(
    credsPath, 
    'metaobject', 
    {
      attrs,
      ...options,
    },
  );

  return response;
};

const shopifyMetaobjectsGetApi = funcApi(shopifyMetaobjectsGet, {
  argNames: ['credsPath', 'options'],
});

module.exports = {
  shopifyMetaobjectsGet,
  shopifyMetaobjectsGetApi,
};

// curl localhost:8000/shopifyMetaobjectsGet -H "Content-Type: application/json" -d '{ "credsPath": "au" }'