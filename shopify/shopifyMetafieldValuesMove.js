const { funcApi, logDeep, surveyNestedArrays, Processor, askQuestion, FakeGetter } = require('../utils');
const { shopifyGetter } = require('../shopify/shopify.utils');
const { shopifyMetafieldsSet } = require('../shopify/shopifyMetafieldsSet');
const { shopifyBulkOperationDo } = require('../shopify/shopifyBulkOperationDo');

const {
  MAX_METAFIELDS_PER_SET,
} = require('../shopify/shopify.constants');

const shopifyMetafieldValuesMove = async (
  store,
  resource,
  fromMetafieldPath,
  toMetafieldPath,
  {
    apiVersion,
    onlyMoveIfNewer = false,
    useBulkFetch = false,
  } = {},
) => {

  logDeep({
    store,
    resource,
    fromMetafieldPath,    
    toMetafieldPath,
  });

  const piles = {
    resources: [],
    shopifyMetafieldsSet: [],
    results: [],
  };

  const [fromMfNamespace, fromMfKey] = fromMetafieldPath.split('.');
  const [toMfNamespace, toMfKey] = toMetafieldPath.split('.');

  const attrs = `
    id
    fromMetafield: metafield(namespace: "${ fromMfNamespace }", key: "${ fromMfKey }") {
      type
      value
      ${ onlyMoveIfNewer ? 'updatedAt' : '' }
    }
    toMetafield: metafield(namespace: "${ toMfNamespace }", key: "${ toMfKey }") {
      type
      value
      ${ onlyMoveIfNewer ? 'updatedAt' : '' }
    }
  `;

  // Use the dynamic getter to fetch resources
  // Include the from and to metafield paths in the query
  let getter;
  
  if (useBulkFetch) {

    const shopifyBulkQuery = `{
      ${ resource }s(query: "metafields.${ fromMfNamespace }.${ fromMfKey }:*") {
        edges {
          node {
            ${ attrs }
          }
        }
      }
    }`;

    getter = new FakeGetter(
      shopifyBulkOperationDo,
      [
        store, 
        'query',
        shopifyBulkQuery,
        { apiVersion },
      ],
      {
        onItems: (items) => {
          piles.resources.push(...items);
        },
        onDone: () => {
          logDeep(surveyNestedArrays(piles));
        },
      },
    );

  } else {
    getter = await shopifyGetter(
      store,
      resource,
      {
        // Note: not working, I think query won't work without a metafield definition
        queries: [`metafields.${ fromMfNamespace }.${ fromMfKey }:*`],
        attrs,

        apiVersion,
        
        onItems: (items) => {
          piles.resources.push(...items);

          logDeep(surveyNestedArrays(piles));
          logDeep(piles.resources[piles.resources.length - 1]);
        },
      },
    );
  }
  
  // Use an assessor to determine whether the values already match or not
  const assessor = new Processor(
    piles.resources,
    async (pile) => {
      const resource = pile.shift();
      const { id: resourceGid, fromMetafield, toMetafield } = resource;
      const { 
        value: fromValue, 
        type: fromType,
        updatedAt: fromUpdatedAt,
      } = fromMetafield || {};
      const { 
        value: toValue, 
        type: toType,
        updatedAt: toUpdatedAt,
      } = toMetafield || {};
      
      // If no value in fromMetafield, skip
      // TODO: Consider mode that would clear toMetafield
      if (!fromValue) {
        return;
      }
      
      // If metafields already match, skip
      if (toValue === fromValue) {
        return;
      }
      
      // If onlyMoveIfNewer and toMetafield was updated more recently, skip
      if (onlyMoveIfNewer && (fromUpdatedAt < toUpdatedAt)) {
        return;
      }
      
      // If types don't match, that's weird.
      if (toType && (fromType !== toType)) {
        throw new Error(`Type mismatch for ${ fromMetafieldPath } and ${ toMetafieldPath } (${ fromType } vs ${ toType })`);
      }
      
      piles.shopifyMetafieldsSet.push({
        ownerId: resourceGid,
        namespace: toMfNamespace,
        key: toMfKey,
        type: fromType,
        value: fromValue,
      });
    },
    pile => pile.length === 0,
    {
      canFinish: false,
    },
  );

  getter.on('done', () => {
    assessor.canFinish = true;
  });

  // Use an actioner to self-serve from the metafieldsSet pile
  const actioner = new Processor(
    piles.shopifyMetafieldsSet,
    async (pile) => {
      const metafieldPayloads = pile.splice(0, MAX_METAFIELDS_PER_SET);

      logDeep(metafieldPayloads);
      await askQuestion('?');

      const response = await shopifyMetafieldsSet(
        store,
        metafieldPayloads,
        {
          apiVersion,
        },
      );
      
      if (!response?.success) {
        console.error(response);
      }

      piles.results.push(response);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: 'shopifyMetafieldsSet',
    },
  );

  assessor.on('done', () => {
    actioner.canFinish = true;
  });

  await Promise.all([
    getter.run(),
    assessor.run(),
    actioner.run(),
  ]);

  return {
    success: true,
    result: surveyNestedArrays(piles),
  };
};

const shopifyMetafieldValuesMoveApi = funcApi(shopifyMetafieldValuesMove, {
  argNames: ['store', 'resource', 'fromMetafieldPath', 'toMetafieldPath', 'options'],
  validatorsByArg: {
    store: Boolean,
    resource: Boolean,
    fromMetafieldPath: p => p.includes('.'),
    toMetafieldPath: p => p.includes('.'),
  },
});

module.exports = {
  shopifyMetafieldValuesMove,
  shopifyMetafieldValuesMoveApi,
};

// curl localhost:8000/shopifyMetafieldValuesMove -H "Content-Type: application/json" -d '{ "store": "au", "resource": "customer", "fromMetafieldPath": "facts.date_of_birth", "toMetafieldPath": "facts.birth_date", "options": { "onlyMoveIfNewer": true, "useBulkFetch": true } }'