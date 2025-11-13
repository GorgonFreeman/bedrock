// https://shopify.dev/docs/api/admin-graphql/latest/mutations/inventorysetquantities

const { funcApi, logDeep, arrayToChunks, actionMultipleOrSingle, objHasAny } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');
const {
  MAX_PAYLOADS,
  INVENTORY_NAMES,
  INVENTORY_REASONS,
} = require('../shopify/shopify.constants');

const defaultAttrs = `
  inventoryAdjustmentGroup {
    createdAt
    reason
    referenceDocumentUri
    changes {
      name
      delta
      item {
        sku
      }
    }
  }
`;

const shopifyInventoryQuantitiesSetChunk = async (
  credsPath,
  inventoryName,
  quantities,
  reason,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
    ignoreCompareQuantity = true, // TODO: Consider allowing this to be set as Shopify intends.
  } = {},
) => {

  const mutationName = 'inventorySetQuantities';
  
  const mutationVariables = {
    input: {
      type: 'InventorySetQuantitiesInput!',
      value: {
        name: inventoryName,
        reason,
        ignoreCompareQuantity,
        quantities,
      },
    },
  };

  const response = await shopifyMutationDo(
    credsPath,
    mutationName,
    mutationVariables,
    returnAttrs,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyInventoryQuantitiesSet = async (
  credsPath,
  inventoryName,
  quantities,
  reason,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  // Chunk quantities array by MAX_PAYLOADS
  const chunks = arrayToChunks(quantities, MAX_PAYLOADS);

  const response = await actionMultipleOrSingle(
    chunks,
    shopifyInventoryQuantitiesSetChunk,
    (chunk) => ({
      args: [credsPath, inventoryName, chunk, reason],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );
  
  logDeep(response);
  return response;
};

const shopifyInventoryQuantitiesSetApi = funcApi(shopifyInventoryQuantitiesSet, {
  argNames: ['credsPath', 'inventoryName', 'quantities', 'reason', 'options'],
  validatorsByArg: {
    inventoryName: p => INVENTORY_NAMES.includes(p),
    quantities: p => Array.isArray(p) && p.every(i => objHasAny(i, ['inventoryItemId', 'locationId', 'quantity'])),
    reason: p => INVENTORY_REASONS.includes(p),
  },
});

module.exports = {
  shopifyInventoryQuantitiesSet,
  shopifyInventoryQuantitiesSetApi,
};

// curl http://localhost:8000/shopifyInventoryQuantitiesSet -H 'Content-Type: application/json' -d '{ "credsPath": "au", "inventoryName": "available", "quantities": [{ "inventoryItemId": "gid://shopify/InventoryItem/________", "locationId": "gid://shopify/Location/________", "quantity": 25 }], "reason": "other" }'