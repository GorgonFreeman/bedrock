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
    },
  );

  logDeep(locationsResponse);

  const response = locationsResponse;
  logDeep(response);
  return response;
};

const shopifyLocationGetMainApi = funcApi(shopifyLocationGetMain, {
  argNames: ['credsPath', 'options'],
});

module.exports = {
  shopifyLocationGetMain,
  shopifyLocationGetMainApi,
};

// curl localhost:8000/shopifyLocationGetMain -H "Content-Type: application/json" -d '{ "credsPath": "au" }'