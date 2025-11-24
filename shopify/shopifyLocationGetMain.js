const { funcApi, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const defaultAttrs = `id name`;

const shopifyLocationGetMain = async (
  credsPath,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const response = {
    success: true,
    result: 'true',
  };
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