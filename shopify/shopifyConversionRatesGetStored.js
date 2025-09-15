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

  if (!response.success) {
    console.log(`Error getting conversion rates for ${ credsPath }: ${ response.error }`);
    return {
      success: false,
      error: ['Conversion rates fetch failed'],
    };
  }

  const conversionRates = JSON.parse(response.result.value) || {};
  if (!conversionRates) {
    console.log(`Error parsing conversion rates for ${ credsPath }`);
    return {
      success: false,
      error: ['Conversion rates parse failed'],
    };
  }
  return {
    success: true,
    result: conversionRates,
  };
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