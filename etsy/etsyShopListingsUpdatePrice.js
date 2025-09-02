const { funcApi, logDeep } = require('../utils');
const { etsyShopListingsGet } = require('../etsy/etsyShopListingsGet');
const { etsyListingInventoryUpdate } = require('../etsy/etsyListingInventoryUpdate');

const etsyShopListingsUpdatePrice = async (
  priceDecimal,
  {
    credsPath,
  } = {},
) => {
  const response = true;
  logDeep(response);
  return response;
};

const etsyShopListingsUpdatePriceApi = funcApi(etsyShopListingsUpdatePrice,  {
  argNames: ['priceDecimal', 'options'],
  validatorsByArg: { priceDecimal: Boolean },
});

module.exports = {
  etsyShopListingsUpdatePrice,
  etsyShopListingsUpdatePriceApi,
};

// curl localhost:8000/etsyShopListingsUpdatePrice -H "Content-Type: application/json" -d '{ "priceDecimal": 50.00 }'