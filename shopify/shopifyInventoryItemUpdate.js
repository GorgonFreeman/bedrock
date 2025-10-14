// https://shopify.dev/docs/api/admin-graphql/latest/mutations/inventoryitemupdate

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `id countryCodeOfOrigin harmonizedSystemCode`;

const shopifyInventoryItemUpdate = async (
  credsPath,
  inventoryItemId,
  updatePayload,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const mutationName = 'inventoryItemUpdate';

  const response = await shopifyMutationDo(
    credsPath,
    mutationName,
    {
      id: {
        type: 'ID!',
        value: `gid://shopify/InventoryItem/${ inventoryItemId }`,
      },
      input: {
        type: 'InventoryItemInput!',
        value: updatePayload,
      },
    },
    `inventoryItem { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyInventoryItemUpdateApi = funcApi(shopifyInventoryItemUpdate, {
  argNames: ['credsPath', 'inventoryItemId', 'updatePayload', 'options'],
});

module.exports = {
  shopifyInventoryItemUpdate,
  shopifyInventoryItemUpdateApi,
};

// curl http://localhost:8000/shopifyInventoryItemUpdate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "inventoryItemId": "43729076", "updatePayload": { "cost": 145.89, "tracked": false, "countryCodeOfOrigin": "US", "provinceCodeOfOrigin": "OR", "harmonizedSystemCode": "621710", "countryHarmonizedSystemCodes": [{ "harmonizedSystemCode": "6217109510", "countryCode": "CA" }] }, "options": { "returnAttrs": "id" } }'