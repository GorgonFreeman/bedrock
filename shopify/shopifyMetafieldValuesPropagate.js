const { funcApi, logDeep, askQuestion } = require('../utils');

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
  
  // Return if any responses errored
  for (const response of [fromStoreDataResponse, ...toStoreDataResponses]) {
    const {
      success: dataSuccess,
    } = response;
    if (!dataSuccess) {
      return response;
    }
  }

  const fromStoreData = fromStoreDataResponse.result;
  const toStoresData = toStoreDataResponses.map(response => response.result);
  
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

  for (const [index, store] of toStores.entries()) {
    const toStoreData = toStoresData[index];
    for (const resource of toStoreData) {

      const {
        id: resourceGid,
        [commonIdProp]: commonId,
      } = resource;

      commonIdToStoreIdObject[commonId] = commonIdToStoreIdObject[commonId] || {};
      commonIdToStoreIdObject[commonId][store] = resourceGid;
    }
  }

  logDeep('commonIdToStoreIdObject', commonIdToStoreIdObject);

  const payloads = [];

  for (const fromResource of fromStoreData) {
    const {
      id: resourceGid,
      [commonIdProp]: commonId,
    } = fromResource;

    for (const [index, store] of toStores.entries()) {
      const toStoreData = toStoresData[index];
      const toResource = toStoreData.find(toResource => toResource[commonIdProp] === commonId);

      logDeep(fromResource, toResource);
      await askQuestion('?');

      for (const metafieldPath of metafieldPaths) {
        const [namespace, key] = metafieldPath.split('.');
        const mfPropName = `${ namespace }__${ key }`;

        const mfFrom = fromResource[mfPropName];
        const mfTo = toResource[mfPropName];

        if (!mfFrom) {
          continue;
        }

        const {
          value: fromValue,
          type: fromType,
        } = mfFrom;
        
        // TODO: Provide an option to clear unset metafields if desired
        if (fromValue === null) {
          continue;
        }

        const {
          value: toValue,
          type: toType,
        } = mfTo || {};

        if (toType && (fromType !== toType)) {
          return {
            success: false,
            error: [`Metafield type mismatch for ${ metafieldPath }`],
          };
        }

        const mfType = fromType;

        let desiredValue = fromValue;
        
        // Transform any incomparable metafield values
        switch (mfType) {

          case 'list.product_reference':
            
            // TODO: Handle GIDs not existing in map
            desiredValue = JSON.parse(fromValue).map(productGid => {
              const toProductId = Object.values(commonIdToStoreIdObject).find(storeIdObject => storeIdObject[fromStore] === productGid)?.[toStore];
              return toProductId;
            });
            break;
        }

        const needsUpdate = toValue !== desiredValue;

        if (!needsUpdate) {
          continue;
        }

        payloads.push({
          ownerId: resourceGid,
          namespace,
          key,
          type: mfType,
          value: desiredValue,
        });
      }
    }
  }

  logDeep(payloads);

  return {
    success: true,
    result: payloads,
  };
};

const shopifyMetafieldValuesPropagateApi = funcApi(shopifyMetafieldValuesPropagate, {
  argNames: ['fromStore', 'toStores', 'resource', 'metafieldPaths', 'options'],
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
// curl localhost:8000/shopifyMetafieldValuesPropagate -H "Content-Type: application/json" -d '{ "fromStore": "au", "toStores": ["us","uk"], "resource": "product", "metafieldPaths": ["specifications.how_to", "specifications.fabrication", "specifications.ingredients", "specifications.size_and_fit", "related_products.siblings"] }'