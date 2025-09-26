const { HOSTED } = require('../constants');
const { funcApi, logDeep, arrayStandardResponse, customNullish, askQuestion, gidToId } = require('../utils');

const { shopifyMetaobjectsGet } = require('../shopify/shopifyMetaobjectsGet');
const { shopifyMetaobjectCreate } = require('../shopify/shopifyMetaobjectCreate');
const { shopifyMetaobjectGet } = require('../shopify/shopifyMetaobjectGet');

const metaobjectsData = {};

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

      // Skip fields with null/undefined values to satisfy GraphQL non-null constraints
      if (customNullish(fieldValue)) {
        continue;
      }

      if (fieldType === 'metaobject_reference') {
        // Handle metaobject reference
        interactive && logDeep('field', field);
        interactive && await askQuestion('?');

        const fromMetaobjectId = gidToId(fieldValue);
        
        // TODO: check if array-style fromCredsPath works
        let fromMetaobject = metaobjectsData?.[fromCredsPath]?.[fromMetaobjectId];

        if (!fromMetaobject) {
          const fromMetaobjectResponse = await shopifyMetaobjectGet(
            fromCredsPath,
            {
              metaobjectId: fromMetaobjectId,
            },
            {
              apiVersion,
              attrs: 'id handle type',
            }, 
          );

          const { success: fromMetaobjectGetSuccess, result: fromMetaobjectResult } = fromMetaobjectResponse;
          if (!fromMetaobjectGetSuccess) {
            return fromMetaobjectResponse;
          }

          fromMetaobject = fromMetaobjectResult;
          metaobjectsData[fromCredsPath] = metaobjectsData[fromCredsPath] || {};
          metaobjectsData[fromCredsPath][fromMetaobjectId] = fromMetaobject;
        }

        interactive && logDeep('fromMetaobject', fromMetaobject);
        interactive && await askQuestion('?');

        let toMetaobject = metaobjectsData?.[toCredsPath]?.[fromMetaobjectId];

        if (!toMetaobject) {
          const toMetaobjectResponse = await shopifyMetaobjectGet(
            toCredsPath,
            {
              metaobjectHandle: fromMetaobject.handle,
              metaobjectType: fromMetaobject.type,
            },
            {
              apiVersion,
              attrs: 'id handle type',
            },
          );

          const { success: toMetaobjectGetSuccess, result: toMetaobjectResult } = toMetaobjectResponse;
          if (!toMetaobjectGetSuccess) {
            return toMetaobjectResponse;
          }

          toMetaobject = toMetaobjectResult;
          metaobjectsData[toCredsPath] = metaobjectsData[toCredsPath] || {};
          metaobjectsData[toCredsPath][fromMetaobjectId] = toMetaobject;
        }

        interactive && logDeep('toMetaobject', toMetaobject);
        interactive && await askQuestion('?');
        
        const toMetaobjectGid = toMetaobject.id;
        transformedFields.push({
          key: fieldKey,
          value: toMetaobjectGid,
        });

        continue;
      }

      if (fieldType === 'file_reference') {
        // TODO: Handle file reference
        // logDeep('field', field);
        // await askQuestion('?');
        continue;
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