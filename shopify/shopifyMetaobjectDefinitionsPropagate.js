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

// Transform metaobject definition data for creation
const metaobjectDefinitionToCreatePayload = (metaobjectDefinition) => {

  const { 
    name: moDefName,
    type: moDefType,
    description: moDefDescription,
    access: moDefAccess,
    capabilities: moDefCapabilities,
    displayNameKey: moDefDisplayNameKey,
    fieldDefinitions: moDefFieldDefinitions,
  } = metaobjectDefinition;

  const {
    storefront: moDefAccessStorefront,
    admin: moDefAccessAdmin,
  } = moDefAccess;

  const {
    translatable: moDefCapabilitiesTranslatable,
    publishable: moDefCapabilitiesPublishable,
  } = moDefCapabilities;

  // Check if this is an app-reserved type (starts with '$app:')
  const isAppReservedType = moDefType.startsWith('$app:');
  
  const createPayload = {
    name: moDefName,
    type: moDefType,
    description: moDefDescription,
    access: {
      storefront: moDefAccessStorefront,
      // Only include admin access for app-reserved types
      ...(isAppReservedType && {
        admin: moDefAccessAdmin === 'PUBLIC_READ_WRITE' ? 'MERCHANT_READ_WRITE' : moDefAccessAdmin,
      }),
    },
    capabilities: {
      translatable: { enabled: moDefCapabilitiesTranslatable.enabled },
      publishable: { enabled: moDefCapabilitiesPublishable.enabled },
    },
    displayNameKey: moDefDisplayNameKey,
    fieldDefinitions: moDefFieldDefinitions.map(field => ({
      name: field.name,
      key: field.key,
      type: field.type.name, // Convert type object to string
      description: field.description,
      required: field.required,
      validations: field.validations, // TODO: handle validations that are name: "metaobject_definition_id" by looking up the metaobject definition by handle on the destination store
    })),
  };

  return createPayload;
};

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

  // Transform the data for creation
  const transformedDefinitions = metaobjectDefinitions.map(metaobjectDefinitionToCreatePayload);

  const responses = await Promise.all(toCredsPaths.map(credsPath => {
    return shopifyMetaobjectDefinitionCreate(
      credsPath, 
      transformedDefinitions, 
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