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
  } = {},
) => {

  return true;

  const response = await shopifyMutationDo(
    credsPath,
    'pageCreate',
    {
      page: {
        type: 'PageCreateInput!',
        value: pageInput,
      },
    },
    `page { ${ returnAttrs } }`,
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

// curl http://localhost:8000/shopifyInventoryQuantitiesSet -H 'Content-Type: application/json' -d '{ "credsPath": "au", "pageInput": { "title": "Batarang Blueprints", "body": "<strong>Good page!</strong>" }, "options": { "returnAttrs": "id" } }'