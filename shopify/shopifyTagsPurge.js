const { funcApi, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');
const { shopifyTagsRemove } = require('../shopify/shopifyTagsRemove');

const shopifyTagsPurge = async (
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

const shopifyTagsPurgeApi = funcApi(shopifyTagsPurge, {
  argNames: ['credsPath', 'tagsIdentifier', 'resource', 'options'],
});

module.exports = {
  shopifyTagsPurge,
  shopifyTagsPurgeApi,
};

// curl localhost:8000/shopifyTagsPurge -H "Content-Type: application/json" -d '{ "credsPath": "au", "tagsIdentifier": { "tags": ["demo_will_publish"] }, "resource": "product" }'