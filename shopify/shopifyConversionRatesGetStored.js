const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyMetafieldGet } = require('../shopify/shopifyMetafieldGet');

const defaultAttrs = `id`;

const shopifyConversionRatesGetStored = async (
  credsPath,
  {
    apiVersion,
  } = {},
) => {

  const response = await shopifyMetafieldGet(
    credsPath,
    'shop',
    'shop',
    'global',
    'conversion_rates',
    {
      apiVersion,
    }
  );

  logDeep(response);
  return response;
};

const shopifyConversionRatesGetStoredApi = async (req, res) => {
  const { 
    credsPath,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyConversionRatesGetStored(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyConversionRatesGetStored,
  shopifyConversionRatesGetStoredApi,
};

// curl localhost:8000/shopifyConversionRatesGetStored -H "Content-Type: application/json" -d '{ "credsPath": "au" }'