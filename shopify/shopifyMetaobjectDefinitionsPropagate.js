const { funcApi, logDeep, arrayStandardResponse } = require('../utils');
const { shopifyMetaobjectDefinitionsGet } = require('../shopify/shopifyMetaobjectDefinitionsGet');
const { shopifyMetaobjectDefinitionCreate } = require('../shopify/shopifyMetaobjectDefinitionCreate');

// All attributes needed to recreate in the destination stores
const attrs = `
  id
  name
  type
  description
  access {
    admin
    storefront
  }
  capabilities {
    translatable {
      enabled
    }
    publishable {
      enabled
    }
  }
  displayNameKey
  fieldDefinitions {
    name
    key
    type {
      name
      category
    }
    description
    required
    validations {
      name
      value
    }
  }
`;

const shopifyMetaobjectDefinitionsPropagate = async (
  fromCredsPath,
  toCredsPaths,
  {
    apiVersion,
    fetchOptions,
  } = {},
) => {

  const shopifyMetaobjectDefinitionsResponse = await shopifyMetaobjectDefinitionsGet(
    fromCredsPath,
    {
      apiVersion,
      attrs,
      ...fetchOptions,
    },
  );

  const { success: metaobjectDefinitionsGetSuccess, result: metaobjectDefinitions } = shopifyMetaobjectDefinitionsResponse;
  if (!metaobjectDefinitionsGetSuccess) {
    return shopifyMetaobjectDefinitionsResponse;
  }

  const responses = await Promise.all(toCredsPaths.map(credsPath => {
    return shopifyMetaobjectDefinitionCreate(
      credsPath, 
      metaobjectDefinitions, 
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

const shopifyMetaobjectDefinitionsPropagateApi = funcApi(shopifyMetaobjectDefinitionsPropagate, {
  argNames: ['fromCredsPath', 'toCredsPaths', 'options'],
  validatorsByArg: {
    toCredsPaths: Array.isArray,
  },
});

module.exports = {
  shopifyMetaobjectDefinitionsPropagate,
  shopifyMetaobjectDefinitionsPropagateApi,
};

// curl localhost:8000/shopifyMetaobjectDefinitionsPropagate -H "Content-Type: application/json" -d '{ "fromCredsPath": "au", "toCredsPaths": ["us", "uk"] }'