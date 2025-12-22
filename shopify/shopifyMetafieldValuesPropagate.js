const { funcApi } = require('../utils');

const shopifyMetafieldValuesPropagate = async (
  fromStore,
  toStores,
  resource,
  metafieldPaths,
  {
    apiVersion,
    option,
  } = {},
) => {
  return {
    success: true,
    result: `I don't do anything yet`,
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