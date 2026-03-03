const { funcApi, logDeep, surveyNestedArrays } = require('../utils');
const { shopifyGetter } = require('../shopify/shopify.utils');
const { shopifyMetafieldsSet } = require('../shopify/shopifyMetafieldsSet');

const shopifyMetafieldValuesMove = async (
  store,
  resource,
  fromMetafieldPath,
  toMetafieldPath,
  {
    apiVersion,
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

  // Use the dynamic getter to fetch resources
  // Include the from and to metafield paths in the query
  const getter = await shopifyGetter(
    store,
    resource,
    {
      attrs: `
        id
        fromMetafield: metafield(namespace: "${ fromMfNamespace }", key: "${ fromMfKey }") {
          value
        }
        toMetafield: metafield(namespace: "${ toMfNamespace }", key: "${ toMfKey }") {
          value
        }
      `,

      apiVersion,
      
      onItems: (items) => {
        piles.resources.push(...items);

        logDeep(surveyNestedArrays(piles));
        logDeep(piles.resources[piles.resources.length - 1]);
      },
    },
  );
  
  // Use an assessor to determine whether the values already match or not
  // Use an actioner to self-serve from the metafieldsSet pile

  await Promise.all([
    getter.run(),
  ]);

  return {
    success: true,
    result: {
      message: `I don't do anything yet`,
    },
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

// curl localhost:8000/shopifyMetafieldValuesMove -H "Content-Type: application/json" -d '{ "store": "au", "resource": "customer", "fromMetafieldPath": "facts.date_of_birth", "toMetafieldPath": "facts.birth_date" }'