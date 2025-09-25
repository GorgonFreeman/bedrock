const { funcApi, logDeep, arrayStandardResponse, customNullish } = require('../utils');
const { shopifyMetaobjectsGet } = require('../shopify/shopifyMetaobjectsGet');
const { shopifyMetaobjectCreate } = require('../shopify/shopifyMetaobjectCreate');

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
const metaobjectToCreatePayload = (metaobject) => {

  const { 
    handle,
    displayName,
    type,
    fields,
  } = metaobject;

  const createPayload = {
    type,
    handle,
    fields: fields
      .filter(field => field.type !== 'metaobject_reference')
      .filter(field => !customNullish(field.value))
      .map(field => ({
        key: field.key,
        value: field.value,
    })),
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
  } = {},
) => {

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

  // Transform the data for creation
  const transformedMetaobjects = metaobjects.map(metaobjectToCreatePayload);

  const responses = await Promise.all(toCredsPaths.map(credsPath => {
    return shopifyMetaobjectCreate(
      credsPath, 
      transformedMetaobjects, 
      {
        apiVersion,
        returnAttrs: attrs,
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