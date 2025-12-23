const SUBKEY = 'metafields_sweep';

const { funcApi, logDeep, askQuestion, arrayStandardResponse, MultiDex } = require('../utils');

const { shopifyBulkOperationDo } = require('../shopify/shopifyBulkOperationDo');
const { shopifyMetafieldsSet } = require('../shopify/shopifyMetafieldsSet');
const { shopifyProductGet } = require('../shopify/shopifyProductGet');

const resourceToCommonIdProp = {
  product: 'handle',
  productVariant: 'sku',
  collection: 'handle',
  customer: 'email',
};

const metafieldIsEmpty = async (value, type) => {

  if (!value) {
    return true;
  }

  logDeep(value, type);
  await askQuestion('?');

  if (type.startsWith('list.')) {
    return value === '[]';
  }

  return value === null;
};

const shopifyMetafieldValuesPropagate = async (
  fromStore,
  toStores,
  resource,
  metafieldPaths,
  {
    apiVersion,
    resources,
    onlyWriteIfEmpty = false, // if the destination metafield has content, don't overwrite it. This allows divergence after the initial sync.
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

  // const storeToBulkOpId = {
  //   au: '3608468160584',
  //   us: '4916969930812',
  //   uk: '8987994620277',
  // };

  const [
    fromStoreDataResponse,
    ...toStoreDataResponses
  ] = await Promise.all([
    shopifyBulkOperationDo(
      `${ fromStore }.${ SUBKEY }`,
      'query',
      query,
      {
        apiVersion,
        // resumeBulkOperationId: storeToBulkOpId[fromStore],
      },
    ),
    ...toStores.map(toStore => {
      return shopifyBulkOperationDo(
        `${ toStore }.${ SUBKEY }`,
        'query',
        query,
        {
          apiVersion,
          // resumeBulkOperationId: storeToBulkOpId[toStore],
        },
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
  
  const idDex = new MultiDex([commonIdProp, fromStore, ...toStores], { items: fromStoreData });
  
  for (const resource of fromStoreData) {
    const { 
      id: resourceGid,
      [commonIdProp]: commonId,
      ...resourceData
    } = resource;

    const dataProp = `${ fromStore }Data`;

    idDex.add({
      [commonIdProp]: commonId,
      [fromStore]: resourceGid,
      [dataProp]: resourceData,
    });
  }

  for (const [index, toStore] of toStores.entries()) {
    const toStoreData = toStoresData[index];
    for (const resource of toStoreData) {

      const { 
        id: resourceGid,
        [commonIdProp]: commonId,
        ...resourceData
      } = resource;

      const dataProp = `${ toStore }Data`;

      idDex.add({
        [commonIdProp]: commonId,
        [toStore]: resourceGid,
        [dataProp]: resourceData,
      });
    }
  }

  logDeep('idDex', idDex.survey());
  // await askQuestion('?');

  const payloads = {};

  for (const fromResource of fromStoreData) {

    const {
      id: resourceGid,
      [commonIdProp]: commonId,
    } = fromResource;

    const resource = idDex.get(commonIdProp, commonId);

    logDeep('resource', resource);
    // await askQuestion('?');

    for (const [index, toStore] of toStores.entries()) {
      const toStoreDataProp = `${ toStore }Data`;
      const toStoreData = resource[toStoreDataProp];

      if (!toStoreData) {
        console.warn(`${ commonId } not found in ${ toStore }`);
        continue;
      }

      logDeep('toStoreData', toStoreData);
      // await askQuestion('?');

      for (const metafieldPath of metafieldPaths) {
        const [namespace, key] = metafieldPath.split('.');
        const mfPropName = `${ namespace }__${ key }`;

        const mfFrom = fromResource[mfPropName];
        const mfTo = toStoreData[mfPropName];

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
        
        const toValueIsEmpty = await metafieldIsEmpty(toValue, toType);
        if (onlyWriteIfEmpty && !toValueIsEmpty) {
          continue;
        }

        const mfType = fromType;

        let desiredValue = fromValue;
        
        // Transform any incomparable metafield values
        switch (mfType) {

          case 'list.product_reference':
            
            // TODO: Handle GIDs not existing in map
            const desiredValueArray = [];
            const sourceValue = JSON.parse(fromValue);

            for (const productGid of sourceValue) {
              let dexProduct = idDex.get(fromStore, productGid);

              if (!dexProduct) {

                const fromProductResponse = await shopifyProductGet(fromStore, { productId: gidToId(productGid) }, { attrs: commonIdProp, apiVersion });
                const { success: fromProductGetSuccess, result: fromProductResult } = fromProductResponse;

                // This is an error because it should definitely be on the from store, that's where the data belongs.
                if (!fromProductGetSuccess) {
                  return fromProductResponse;
                }

                idDex.add({
                  [commonIdProp]: fromProductResult[commonIdProp],
                  [fromStore]: productGid,
                });
                dexProduct = idDex.get(fromStore, productGid);
              }

              let toProductGid = dexProduct?.[toStore];
              if (!toProductGid) {
                const toProductResponse = await shopifyProductGet(toStore, { handle: dexProduct[commonIdProp] }, { attrs: 'id', apiVersion });
                const { success: toProductGetSuccess, result: toProductResult } = toProductResponse;
                
                // Ignore this, might just be the product doesn't exist.
                if (!toProductGetSuccess) {
                  continue;
                }
                
                toProductGid = toProductResult.id;

                idDex.add({
                  [commonIdProp]: toProductResult[commonIdProp],
                  [toStore]: toProductGid,
                });  
              }

              desiredValueArray.push(toProductGid);
            }

            // If anything wasn't found, don't propagate the metafield.
            if (desiredValueArray.length !== sourceValue.length) {
              console.warn(`${ commonId }: ${ metafieldPath }: Some products not found in ${ toStore }`);
              continue;
            }

            const desiredValue = JSON.stringify(desiredValueArray);
            break;
        }

        logDeep('needsUpdate', fromValue, desiredValue, toValue);
        // await askQuestion('?');

        const needsUpdate = toValue !== desiredValue;

        if (!needsUpdate) {
          continue;
        }

        const payload = {
          ownerId: resource[toStore],
          namespace,
          key,
          type: mfType,
          value: desiredValue,
        };
        
        logDeep('payload', payload);
        // await askQuestion('?');
        
        payloads[toStore] = payloads[toStore] || [];
        payloads[toStore].push(payload);
      }
    }
  }

  logDeep('payloads', payloads);
  // await askQuestion('?');

  const responses = [];

  for (const [store, payloadsForStore] of Object.entries(payloads)) {
    const metafieldsSetResponse = await shopifyMetafieldsSet(`${ store }.${ SUBKEY }`, payloadsForStore, { apiVersion });
    responses.push(metafieldsSetResponse);
  }

  return arrayStandardResponse(responses);
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

// curl localhost:8000/shopifyMetafieldValuesPropagate -H "Content-Type: application/json" -d '{ "fromStore": "au", "toStores": ["us","uk"], "resource": "product", "metafieldPaths": ["specifications.how_to", "specifications.fabrication", "specifications.ingredients", "specifications.size_and_fit", "related_products.set_products", "related_products.siblings"] }'
// curl localhost:8000/shopifyMetafieldValuesPropagate -H "Content-Type: application/json" -d '{ "fromStore": "au", "toStores": ["us","uk"], "resource": "product", "metafieldPaths": ["related_products.complete_the_look", "related_products.upsell"], "options": { "onlyWriteIfEmpty": true } }'