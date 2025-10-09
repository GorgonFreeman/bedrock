const { funcApi, logDeep, actionMultipleOrSingleV2 } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');
const { shopifyTagsRemove } = require('../shopify/shopifyTagsRemove');

const shopifyTagsPurgeSingle = async (
  credsPath,
  {
    tags,
    // tagPrefix,
  },
  resource,
  {
    apiVersion,
  } = {},
) => {
  
  const resourcesWithTagsResponse = await shopifyGet(
    credsPath,
    resource,
    {
      apiVersion,
      attrs: 'id tags',
      queries: [tags.join(' OR ')],
    },
  );

  let { 
    success: resourcesWithTagsSuccess, 
    result: resourcesWithTags, 
  } = resourcesWithTagsResponse;
  
  if (!resourcesWithTagsSuccess) {
    return resourcesWithTagsResponse;
  }

  resourcesWithTags = resourcesWithTags.filter(resource => resource.tags.some(tag => tags.includes(tag)));

  const response = await shopifyTagsRemove(
    credsPath,
    resourcesWithTags.map(resource => resource.id),
    tags,
    { 
      apiVersion,
      queueRunOptions: {
        interval: 20,
      },
    },
  );

  logDeep(response);
  return response;
};

const shopifyTagsPurge = async (
  credsPath,
  tagsIdentifier,
  resource,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  return actionMultipleOrSingleV2(
    [credsPath, tagsIdentifier], 
    shopifyTagsPurgeSingle, 
    (credsPath, tagsIdentifier) => ({
      args: [credsPath, tagsIdentifier, resource],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
};

const shopifyTagsPurgeApi = funcApi(shopifyTagsPurge, {
  argNames: ['credsPath', 'tagsIdentifier', 'resource', 'options'],
});

module.exports = {
  shopifyTagsPurge,
  shopifyTagsPurgeApi,
};

// curl localhost:8000/shopifyTagsPurge -H "Content-Type: application/json" -d '{ "credsPath": "au", "tagsIdentifier": { "tags": ["demo_will_publish"] }, "resource": "product" }'
// curl localhost:8000/shopifyTagsPurge -H "Content-Type: application/json" -d '{ "credsPath": ["au", "us", "uk"], "tagsIdentifier": [{ "tags": ["demo_will_publish"] }, { "tags": ["fetch"] }], "resource": "product" }'