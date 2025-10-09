// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metaobjectDefinitionCreate

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id name type`;

const shopifyMetaobjectDefinitionCreateSingle = async (
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

const shopifyMetaobjectDefinitionCreate = async (
  credsPath,
  metaobjectDefinitionInput,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    metaobjectDefinitionInput,
    shopifyMetaobjectDefinitionCreateSingle,
    (metaobjectDefinitionInput) => ({
      args: [credsPath, metaobjectDefinitionInput],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyMetaobjectDefinitionCreateApi = funcApi(shopifyMetaobjectDefinitionCreate, {
  argNames: ['credsPath', 'metaobjectDefinitionInput', 'options'],
});

module.exports = {
  shopifyMetaobjectDefinitionCreate,
  shopifyMetaobjectDefinitionCreateSingle,
  shopifyMetaobjectDefinitionCreateApi,
};

// curl http://localhost:8000/shopifyMetaobjectDefinitionCreate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "metaobjectDefinitionInput": { "name": "Yu-Gi-Oh Card", "type": "yugioh-card", "fieldDefinitions": [ { "name": "Title", "key": "title", "type": "single_line_text_field" }, { "name": "Attack", "key": "atk", "type": "number_integer" }, { "name": "Defense", "key": "def", "type": "number_integer" }, { "name": "Mode", "key": "mode", "type": "single_line_text_field", "validations": [ { "name": "choices", "value": "[\"attack\",\"defence\"]" } ] }, { "name": "Effects", "key": "effects", "type": "multi_line_text_field" }, { "name": "Image", "key": "image", "type": "file_reference" } ] }, "options": { "returnAttrs": "id name type fieldDefinitions { name key }" } }'