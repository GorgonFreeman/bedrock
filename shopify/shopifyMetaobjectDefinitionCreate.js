// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metaobjectDefinitionCreate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id name type`;

const shopifyMetaobjectDefinitionCreate = async (
  credsPath,
  metaobjectDefinitionInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'metaobjectDefinitionCreate',
    {
      definition: {
        type: 'MetaobjectDefinitionCreateInput!',
        value: metaobjectDefinitionInput,
      },
    },
    `metaobjectDefinition { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyMetaobjectDefinitionCreateApi = funcApi(shopifyMetaobjectDefinitionCreate, {
  argNames: ['credsPath', 'metaobjectDefinitionInput'],
});

module.exports = {
  shopifyMetaobjectDefinitionCreate,
  shopifyMetaobjectDefinitionCreateApi,
};

// curl http://localhost:8000/shopifyMetaobjectDefinitionCreate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "metaobjectDefinitionInput": { "name": "Custom Product Attributes", "type": "custom_product_attrs", "description": "Custom attributes for products" }, "options": { "returnAttrs": "id name type" } }'