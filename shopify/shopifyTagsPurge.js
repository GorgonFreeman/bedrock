const { funcApi, logDeep, actionMultipleOrSingle, objHasAny } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');
const { shopifyTagsRemove } = require('../shopify/shopifyTagsRemove');

const shopifyTagsPurgeSingle = async (
  credsPath,
  {
    tags,
    tagPrefix,
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
      queries: [
        ...tags 
          ? tags.join(' OR ') 
          // tagPrefix
          : `${ tagPrefix }*`,
      ],
    },
  );

  let { 
    success: resourcesWithTagsSuccess, 
    result: resourcesWithTags, 
  } = resourcesWithTagsResponse;
  
  if (!resourcesWithTagsSuccess) {
    return resourcesWithTagsResponse;
  }
  
  if (tags) {
    resourcesWithTags = resourcesWithTags.filter(resource => resource.tags.some(tag => tags.includes(tag)));
  } else if (tagPrefix) {
    resourcesWithTags = resourcesWithTags.filter(resource => resource.tags.some(tag => tag.startsWith(tagPrefix)));
  }

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
  return actionMultipleOrSingle(
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
  validatorsByArg: {
    tagsIdentifier: p => Array.isArray(p) ? p.every(i => objHasAny(i, ['tags', 'tagPrefix'])) : objHasAny(p, ['tags', 'tagPrefix']),
  },
});

module.exports = {
  shopifyTagsPurge,
  shopifyTagsPurgeApi,
};

// curl localhost:8000/shopifyTagsPurge -H "Content-Type: application/json" -d '{ "credsPath": "au", "tagsIdentifier": { "tags": ["demo_will_publish"] }, "resource": "product" }'
// curl localhost:8000/shopifyTagsPurge -H "Content-Type: application/json" -d '{ "credsPath": ["au", "us", "uk"], "tagsIdentifier": [{ "tags": ["collection:"] }, { "tags": ["0"] }, { "tags": ["#ERROR!"] }], "resource": "product", "options": { "queueRunOptions": { "interval": 20 } } }'
// curl localhost:8100/shopifyTagsPurge -H "Content-Type: application/json" -d '{ "credsPath": ["au", "us", "uk"], "tagsIdentifier": [{ "tagPrefix": "SMS_accepts" }, { "tagPrefix": ["SMS_market"] }, { "tagPrefix": ["Credit Balance"] }, { "tags": ["hello_there"] }], "resource": "customer", "options": { "queueRunOptions": { "interval": 20 } } }'