// https://shopify.dev/docs/api/admin-graphql/latest/queries/inventoryItems

const { funcApi, logDeep } = require('../utils');
const { shopifyGet, shopifyGetter } = require('../shopify/shopify.utils');

const defaultAttrs = `
  sku
  inventoryLevels(first: 50) {
    edges {
      node {
        location {
          id
          name
        }
        quantities(names: [
          "available",
          "on_hand",
        ]) {
          name
          quantity
        } 
      } 
    } 
  }`;

const payloadMaker = (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => {
  return [
    credsPath, 
    'inventoryItem',
    { 
      attrs, 
      ...options,
    },
  ];
};

const shopifyInventoryItemsGet = async (...args) => {
  const response = await shopifyGet(...payloadMaker(...args));
  logDeep(response);
  return response;
};

const shopifyInventoryItemsGetter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const shopifyInventoryItemsGetApi = funcApi(shopifyInventoryItemsGet, {
  argNames: ['credsPath', 'options'],
  validatorsByArg: {
    credsPath: Boolean,
  },
});

module.exports = {
  shopifyInventoryItemsGet,
  shopifyInventoryItemsGetter,
  shopifyInventoryItemsGetApi,
};

// curl localhost:8000/shopifyInventoryItemsGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'
// curl localhost:8000/shopifyInventoryItemsGet -H "Content-Type: application/json" -d "{ \"credsPath\": \"au\", \"options\": { \"queries\": [\"(sku:'2HRDARK-One Size') OR (sku:'BMedium-One Size')\"] } }"
