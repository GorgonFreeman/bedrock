const { funcApi, logDeep, askQuestion, arrayStandardResponse } = require('../utils');
const { etsyShopListingsGet } = require('../etsy/etsyShopListingsGet');
const { etsyListingInventoryUpdate } = require('../etsy/etsyListingInventoryUpdate');

const etsyShopListingsUpdatePrice = async (
  priceDecimal,
  {
    credsPath,
  } = {},
) => {

  const listingsResponse = await etsyShopListingsGet({ credsPath, includes: ['Inventory'] });
  const { success: listingsSuccess, result: listings } = listingsResponse;
  if (!listingsSuccess) {
    return listingsResponse;
  }

  const responses = [];
  for (const listing of listings) {

    const { 
      listing_id: listingId, 
      inventory,
    } = listing;
    const { products } = inventory;

    const priceUpdatePayload = {
      products: products.map(({ offerings }) => ({
        offerings: offerings.map(({ quantity, is_enabled, readiness_state_id }) => ({
          price: priceDecimal,
          is_enabled,
          readiness_state_id,
          quantity,
        })),
      })),
    };
    logDeep(priceUpdatePayload);
    await askQuestion('?');

    const response = await etsyListingInventoryUpdate(listingId, priceUpdatePayload, { credsPath });
    logDeep(response);
    await askQuestion('?');
    responses.push(response);
  }

  return arrayStandardResponse(responses);
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