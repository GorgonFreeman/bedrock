// TODO: Consider making metafield definitions if not found
// TODO: Maintain separate dexes for different resource types

const SUBKEY = 'metafields_sweep';

const { HOSTED } = require('../constants');

const { funcApi, logDeep, askQuestion, arrayStandardResponse, MultiDex } = require('../utils');

const { bedrock_unlisted_slackErrorPost } = require('../bedrock_unlisted/bedrock_unlisted_slackErrorPost');

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
  const failedIds = [];
  
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

  !HOSTED && logDeep('idDex', idDex.survey());

  const payloads = {};

  for (const fromResource of fromStoreData) {

    const {
      id: resourceGid,
      [commonIdProp]: commonId,
    } = fromResource;

    const resource = idDex.get(commonIdProp, commonId);

    if (!resource) {
      console.log(`Resource with ${ commonIdProp } ${ commonId } not found in idDex`, {
        fromResource,
      });
      !HOSTED && await askQuestion('?');
      continue;
    }

    for (const [index, toStore] of toStores.entries()) {
      const toStoreDataProp = `${ toStore }Data`;
      const toStoreData = resource[toStoreDataProp];

      if (!toStoreData) {
        console.warn(`${ commonId } not found in ${ toStore }`);
        continue;
      }

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

              if (failedIds.includes(productGid)) {
                continue;
              }

              let dexProduct = idDex.get(fromStore, productGid);

              if (!dexProduct) {

                const fromProductResponse = await shopifyProductGet(fromStore, { productId: gidToId(productGid) }, { attrs: commonIdProp, apiVersion });
                const { success: fromProductGetSuccess, result: fromProductResult } = fromProductResponse;

                // This is an error because it should definitely be on the from store, that's where the data belongs.
                if (!fromProductGetSuccess) {
                  return fromProductResponse;
                }

                const fromProduct = fromProductResult?.product || fromProductResult;

                if (!fromProduct) {
                  return {
                    success: false,
                    errors: [`Product ${ productGid } not found in own store ${ fromStore }`],
                  };
                }

                idDex.add({
                  [commonIdProp]: fromProduct[commonIdProp],
                  [fromStore]: productGid,
                });
                dexProduct = idDex.get(fromStore, productGid);
              }

              let toProductGid = dexProduct?.[toStore];
              if (!toProductGid) {
                const toProductResponse = await shopifyProductGet(toStore, { handle: dexProduct[commonIdProp] }, { attrs: 'id', apiVersion });
                const { success: toProductGetSuccess, result: toProductResult } = toProductResponse;
                
                if (!toProductGetSuccess) {
                  return toProductGetSuccess;
                }

                const toProduct = toProductResult?.product || toProductResult;

                if (!toProduct) {
                  failedIds.push(productGid);
                  continue;
                }
                
                toProductGid = toProduct.id;

                idDex.add({
                  [commonIdProp]: toProduct[commonIdProp],
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

            desiredValue = JSON.stringify(desiredValueArray);
            break;
        }

        const needsUpdate = toValue !== desiredValue;

        if (!needsUpdate) {
          continue;
        }

        // logDeep({ resource }, { fromValue, toValue, desiredValue, needsUpdate });
        // await askQuestion('?');

        const payload = {
          ownerId: resource[toStore],
          namespace,
          key,
          type: mfType,
          value: desiredValue,
        };
        
        payloads[toStore] = payloads[toStore] || [];
        payloads[toStore].push(payload);
      }
    }
  }

  !HOSTED && logDeep('payloads', payloads);
  // await askQuestion('?');

  const responses = [];

  for (const [store, payloadsForStore] of Object.entries(payloads)) {
    const metafieldsSetResponse = await shopifyMetafieldsSet(`${ store }.${ SUBKEY }`, payloadsForStore, { apiVersion });
    responses.push(metafieldsSetResponse);
  }

  const response = arrayStandardResponse(responses);
  if (!response.success || !HOSTED) {
    logDeep(response);
  }
  return response;
};

const shopifyMetafieldValuesPropagateApi = funcApi(shopifyMetafieldValuesPropagate, {
  argNames: ['fromStore', 'toStores', 'resource', 'metafieldPaths', 'options'],
  validatorsByArg: {
    fromStore: Boolean,
    toStores: Array.isArray,
    resource: Boolean,
    metafieldPaths: Array.isArray,
  },
  requireHostedApiKey: true,
  errorReporter: bedrock_unlisted_slackErrorPost,
  errorReporterPayload: { options: { logFlavourText: 'shopifyMetafieldValuesPropagate' } },
});

module.exports = {
  shopifyMetafieldValuesPropagate,
  shopifyMetafieldValuesPropagateApi,
};

// curl localhost:8000/shopifyMetafieldValuesPropagate -H "Content-Type: application/json" -d '{ "fromStore": "au", "toStores": ["us","uk"], "resource": "product", "metafieldPaths": ["specifications.how_to", "specifications.fabrication", "specifications.ingredients", "specifications.size_and_fit", "related_products.set_products", "related_products.siblings"] }'
// curl localhost:8000/shopifyMetafieldValuesPropagate -H "Content-Type: application/json" -d '{ "fromStore": "au", "toStores": ["us","uk"], "resource": "product", "metafieldPaths": ["related_products.complete_the_look", "related_products.upsell"], "options": { "onlyWriteIfEmpty": true } }'