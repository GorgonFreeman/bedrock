const { REGIONS_ALL } = require('../constants');
const { funcApi, logDeep } = require('../utils');

const { shopifyVariantsGet } = require('../shopify/shopifyVariantsGet');

const shopifyProductsAuditZeroPrice = async (
  region,
) => {
  return true;
};

const shopifyProductsAuditZeroPriceApi = funcApi(
  shopifyProductsAuditZeroPrice,
  { 
    argNames: ['region'], 
    validatorsByArg: { region: Boolean },
  },
);

module.exports = {
  shopifyProductsAuditZeroPrice,
  shopifyProductsAuditZeroPriceApi,
};

// curl localhost:8000/shopifyProductsAuditZeroPrice -H "Content-Type: application/json" -d '{ "region": "au" }'