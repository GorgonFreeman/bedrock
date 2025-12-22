const { funcApi, logDeep } = require('../utils');

const { shopifyBulkOperationDo } = require('../shopify/shopifyBulkOperationDo');

const resourceToCommonIdProp = {
  product: 'handle',
  productVariant: 'sku',
  collection: 'handle',
  customer: 'email',
};

const shopifyMetafieldValuesPropagate = async (
  fromStore,
  toStores,
  resource,
  metafieldPaths,
  {
    apiVersion,
    resources,
  } = {},
) => {

  resources = resources || `${ resource }s`;

  const commonIdProp = resourceToCommonIdProp[resource];
  if (!commonIdProp) {
    return {
      success: false,
      error: [`Resource "${ resource }" does not have a common ID property`],
    };
  }
  
  // TODO: Consider querying metafields as resources, instead of as attributes
  const query = `{
    ${ resources } {
      edges {
        node {
          id
          ${ commonIdProp }
          ${ metafieldPaths.map(mfPath => {
            const [namespace, key] = mfPath.split('.');
            const mfPropName = `${ namespace }__${ key }`;
            return `${ mfPropName }: metafield(namespace: "${ namespace }", key: "${ key }") { 
              value
              type
            }`;
          }) }
        }
      }
    }
  }`;

  const [
    fromStoreDataResponse,
    ...toStoreDataResponses
  ] = await Promise.all([
    shopifyBulkOperationDo(
      fromStore,
      'query',
      query,
    ),
    ...toStores.map(toStore => {
      return shopifyBulkOperationDo(
        toStore,
        'query',
        query,
      );
    }),
  ]);

  const { 
    success: fromStoreDataSuccess, 
    result: fromStoreData, 
  } = fromStoreDataResponse;
  if (!fromStoreDataSuccess) {
    return fromStoreDataResponse;
  }
  
  const commonIdToStoreIdObject = {};
  
  for (const resource of fromStoreData) {
    const { 
      id: resourceGid,
      [commonIdProp]: commonId,
    } = resource;

    // const resourceId = gidToId(gid);

    commonIdToStoreIdObject[commonId] = {
      [fromStore]: resourceGid,
    };
  }

  logDeep('commonIdToStoreIdObject', commonIdToStoreIdObject);

  const payloads = [];

  for (const [index, store] of toStores.entries()) {
    const toStoreDataResponse = toStoreDataResponses[index];

    const {
      success: toStoreDataSuccess,
      result: toStoreData,
    } = toStoreDataResponse;
    if (!toStoreDataSuccess) {
      return toStoreDataResponse;
    }
  }

  return {
    success: true,
    result: payloads,
  };
};

const shopifyMetafieldValuesPropagateApi = funcApi(shopifyMetafieldValuesPropagate, {  argNames: ['fromStore', 'toStores', 'resource', 'metafieldPaths', 'options'],
  validatorsByArg: {
    fromStore: Boolean,
    toStores: Array.isArray,
    resource: Boolean,
    metafieldPaths: Array.isArray,
  },
});

module.exports = {
  shopifyMetafieldValuesPropagate,
  shopifyMetafieldValuesPropagateApi,
};

// curl localhost:8000/shopifyMetafieldValuesPropagate -H "Content-Type: application/json" -d '{ "fromStore": "au", "toStores": ["us","uk"], "resource": "product", "metafieldPaths": ["specifications.how_to"] }'