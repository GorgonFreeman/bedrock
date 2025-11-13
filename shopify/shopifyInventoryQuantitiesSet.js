// https://shopify.dev/docs/api/admin-graphql/latest/mutations/inventorysetquantities

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');
const {
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

const shopifyInventoryQuantitiesSet = async (
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

const shopifyInventoryQuantitiesSetApi = funcApi(shopifyInventoryQuantitiesSet, {
  argNames: ['credsPath', 'inventoryName', 'quantities', 'reason', 'options'],
  validatorsByArg: {
    inventoryName: p => INVENTORY_NAMES.includes(p),
    quantities: Boolean,
    reason: p => INVENTORY_REASONS.includes(p),
  },
});

module.exports = {
  shopifyInventoryQuantitiesSet,
  shopifyInventoryQuantitiesSetApi,
};

// curl http://localhost:8000/shopifyInventoryQuantitiesSet -H 'Content-Type: application/json' -d '{ "credsPath": "au", "inventoryName": "available", "quantities": [{ "inventoryItemId": "gid://shopify/InventoryItem/________", "locationId": "gid://shopify/Location/________", "quantity": 25 }], "reason": "other" }'