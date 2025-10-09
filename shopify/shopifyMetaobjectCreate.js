// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metaobjectCreate

const { HOSTED } = require('../constants');
const { funcApi, logDeep, actionMultipleOrSingle, askQuestion } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id handle displayName`;

const shopifyMetaobjectCreateSingle = async (
  credsPath,
  metaobjectInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
    interactive,
  } = {},
) => {

  if (interactive) {
    if (HOSTED) {
      return {
        success: false,
        error: ['Interactive mode can only be done locally'],
      };
    }

    logDeep(metaobjectInput);
    await askQuestion('Continue?');
  }

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

const shopifyMetaobjectCreate = async (
  credsPath,
  metaobjectInput,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    metaobjectInput,
    shopifyMetaobjectCreateSingle,
    (metaobjectInput) => ({
      args: [credsPath, metaobjectInput],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyMetaobjectCreateApi = funcApi(shopifyMetaobjectCreate, {
  argNames: ['credsPath', 'metaobjectInput', 'options'],
});

module.exports = {
  shopifyMetaobjectCreate,
  shopifyMetaobjectCreateSingle,
  shopifyMetaobjectCreateApi,
};

// curl http://localhost:8000/shopifyMetaobjectCreate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "metaobjectInput": { "type": "yugioh-card", "handle": "black-luster-soldier", "fields": [ { "key": "title", "value": "Black Luster Soldier" }, { "key": "atk", "value": "3000" }, { "key": "def", "value": "2500" }, { "key": "mode", "value": "attack" }, { "key": "effects", "value": "This card can only be Ritual Summoned with the Ritual Spell Card, \"Black Luster Ritual\". You must also Tribute monsters whose total Level Stars equal 8 or more from the field or your hand." } ] }, "options": { "returnAttrs": "id handle displayName fields { key value }" } }'