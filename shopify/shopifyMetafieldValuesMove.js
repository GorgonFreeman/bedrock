const { funcApi, logDeep } = require('../utils');
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

  // Use the correct getter for the resource
  // Include the from and to metafield paths in the query
  // Use an assessor to determine whether the values already match or not
  // Use an actioner to self-serve from the metafieldsSet pile

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