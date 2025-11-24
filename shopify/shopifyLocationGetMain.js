const { funcApi, logDeep } = require('../utils');
const { shopifyLocationsGet } = require('../shopify/shopifyLocationsGet');

// don't need isActive - includeInactive is false by default
const contextAttrs = `
  fulfillsOnlineOrders
  hasActiveInventory
  isFulfillmentService
  shipsInventory
`;
const defaultAttrs = `id name`;

const shopifyLocationGetMain = async (
  credsPath,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  attrs = `
    ${ contextAttrs }
    ${ attrs }
  `;

  const locationsResponse = await shopifyLocationsGet(
    credsPath,
    {
      attrs,
      includeLegacy: true,
    },
  );

  const { success: locationsSuccess, result: locations } = locationsResponse;
  if (!locationsSuccess) {
    return locationsResponse;
  }

  if (locations.length === 1) {
    return {
      success: true,
      result: locations[0],
    };
  }

  logDeep(locations);

  const filteredLocations = locations.filter(({ fulfillsOnlineOrders, shipsInventory }) => fulfillsOnlineOrders && shipsInventory);

  if (filteredLocations.length === 1) {
    return {
      success: true,
      result: filteredLocations[0],
    };
  }

  return {
    success: false,
    errors: ['Multiple locations found'],
    data: {
      locations,
    },
  };
};

const shopifyLocationGetMainApi = funcApi(shopifyLocationGetMain, {
  argNames: ['credsPath', 'options'],
});

module.exports = {
  shopifyLocationGetMain,
  shopifyLocationGetMainApi,
};

// curl localhost:8000/shopifyLocationGetMain -H "Content-Type: application/json" -d '{ "credsPath": "uk" }'