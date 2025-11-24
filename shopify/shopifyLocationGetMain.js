const { funcApi, logDeep } = require('../utils');
const { shopifyLocationsGet } = require('../shopify/shopifyLocationsGet');

const defaultAttrs = `id name`;

const shopifyLocationGetMain = async (
  credsPath,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const locationsResponse = await shopifyLocationsGet(
    credsPath,
    {
      attrs,
      limit: 2,
      queries: [
        'active:true',
      ],
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
  };
};

const shopifyLocationGetMainApi = funcApi(shopifyLocationGetMain, {
  argNames: ['credsPath', 'options'],
});

module.exports = {
  shopifyLocationGetMain,
  shopifyLocationGetMainApi,
};

// curl localhost:8000/shopifyLocationGetMain -H "Content-Type: application/json" -d '{ "credsPath": "au" }'