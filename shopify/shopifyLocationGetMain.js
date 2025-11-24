const { funcApi, logDeep, credsByPath } = require('../utils');
const { shopifyLocationsGet } = require('../shopify/shopifyLocationsGet');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

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

  const creds = credsByPath(['shopify', credsPath]);
  const { LOCATION_ID } = creds;

  if (LOCATION_ID) {

    if (attrs.trim().split(/\s+/).filter(attr => attr !== 'id').length > 0) {
      const locationResponse = await shopifyGetSingle(
        credsPath,
        'location',
        LOCATION_ID,
        {
          attrs,
        },
      );

      logDeep(locationResponse);
      return locationResponse;
    }

    return {
      success: true,
      result: {
        id: `gid://shopify/Location/${ LOCATION_ID }`,
      },
    };
  }

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