const { HOSTED } = require('../constants');
const { funcApi, logDeep, arrayStandardResponse, customNullish, askQuestion, gidToId } = require('../utils');

const { shopifyMetaobjectsGet } = require('../shopify/shopifyMetaobjectsGet');
const { shopifyMetaobjectCreate } = require('../shopify/shopifyMetaobjectCreate');
const { shopifyMetaobjectGet } = require('../shopify/shopifyMetaobjectGet');

// All attributes needed to recreate metaobjects in the destination stores
const attrs = `
  id
  handle
  displayName
  type
  fields {
    key
    value
    type
    reference {
      ... on MediaImage {
        id
      }
      ... on GenericFile {
        id
      }
      ... on Metaobject {
        id
      }
    }
  }
`;

// Transform metaobject data for creation
const metaobjectToCreatePayload = async (metaobject, fromCredsPath, toCredsPath) => {

  const { 
    handle,
    displayName,
    type,
    fields,
  } = metaobject;

  const transformedFields = [];

  for (const field of fields) {

    const {
      key: fieldKey,
      value: fieldValue,
      type: fieldType,
      reference: fieldReference,
    } = field;

    if (customNullish(fieldValue)) {
      continue;
    }

    if (fieldType === 'metaobject_reference') {
      // Handle metaobject reference
      logDeep('field', field);
      await askQuestion('?');

      const fromMetaobjectId = gidToId(fieldValue);

      const fromMetaobjectResponse = await shopifyMetaobjectGet(
        fromCredsPath,
        fromMetaobjectId,
        {
          // TODO: Support apiVersion and other global options
          // apiVersion,
          attrs: 'id handle displayName',
        },
      );

      const { success: fromMetaobjectGetSuccess, result: fromMetaobject } = fromMetaobjectResponse;
      if (!fromMetaobjectGetSuccess) {
        return fromMetaobjectResponse;
      }

      logDeep('fromMetaobject', fromMetaobject);
      await askQuestion('?');

    }

    transformedFields.push({
      key: fieldKey,
      value: fieldValue,
    });
  }

  const createPayload = {
    type,
    handle,
    fields: transformedFields,
  };

  return createPayload;
};

const shopifyMetaobjectsPropagate = async (
  fromCredsPath,
  toCredsPaths,
  type,
  {
    apiVersion,
    fetchOptions,
    interactive,
  } = {},
) => {

  if (interactive && HOSTED) {
    return {
      success: false,
      error: ['Interactive mode can only be done locally'],
    };
  }

  const shopifyMetaobjectsResponse = await shopifyMetaobjectsGet(
    fromCredsPath,
    type,
    {
      apiVersion,
      attrs,
      ...fetchOptions,
    },
  );

  const { success: metaobjectsGetSuccess, result: metaobjects } = shopifyMetaobjectsResponse;
  if (!metaobjectsGetSuccess) {
    return shopifyMetaobjectsResponse;
  }

  const responses = await Promise.all(toCredsPaths.map(async credsPath => {

    // Transform the data for creation
    const transformedMetaobjects = [];
    for (const mo of metaobjects) {
      const transformedMetaobject = await metaobjectToCreatePayload(mo, fromCredsPath, credsPath);
      transformedMetaobjects.push(transformedMetaobject);
    }

    return shopifyMetaobjectCreate(
      credsPath, 
      transformedMetaobjects, 
      {
        apiVersion,
        returnAttrs: attrs,
        interactive,
      },
    );
  }));

  const response = arrayStandardResponse(responses);
  logDeep(response);
  return response;
};

const shopifyMetaobjectsPropagateApi = funcApi(shopifyMetaobjectsPropagate, {
  argNames: ['fromCredsPath', 'toCredsPaths', 'type', 'options'],
  validatorsByArg: {
    toCredsPaths: Array.isArray,
  },
});

module.exports = {
  shopifyMetaobjectsPropagate,
  shopifyMetaobjectsPropagateApi,
};

// curl localhost:8000/shopifyMetaobjectsPropagate -H "Content-Type: application/json" -d '{ "fromCredsPath": "au", "toCredsPaths": ["us", "uk"], "type": "wishlist_emojis" }'
// curl localhost:8000/shopifyMetaobjectsPropagate -H "Content-Type: application/json" -d '{ "fromCredsPath": "au", "toCredsPaths": ["us", "uk"], "type": "wishlist_emojis", "options": { "interactive": true } }'