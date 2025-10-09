const { funcApi, logDeep } = require('../utils');
const { shopifyGetter } = require('../shopify/shopify.utils');
const { shopifyTagsRemove } = require('../shopify/shopifyTagsRemove');

const shopifyTagsPurge = async (
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
  
  const resourcesWithTagsResponse = await shopifyGetter(
    credsPath,
    resource,
    {
      apiVersion,
    },
  );
  


  const response = {
    success: true,
    result: 'hi',
  };
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

// curl localhost:8000/shopifyTagsPurge -H "Content-Type: application/json" -d '{ "credsPath": "au", "tagsIdentifier": { "tags": "demo_will_publish" }, "resource": "product" }'