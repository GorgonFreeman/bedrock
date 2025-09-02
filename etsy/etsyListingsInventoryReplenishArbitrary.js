const { funcApi, logDeep, randomNumber, askQuestion, arrayStandardResponse } = require('../utils');
const { etsyShopListingsGet } = require('../etsy/etsyShopListingsGet');
const { etsyListingInventoryUpdate } = require('../etsy/etsyListingInventoryUpdate');

const etsyListingsInventoryReplenishArbitrary = async (
  {
    eligibleStockMax = 0,
    replenishToMax = 10,
    replenishToMin = 5,
    credsPath,
  } = {},
) => {

  const listingsResponse = await etsyShopListingsGet({ credsPath, includes: ['Inventory'] });
  const { success: listingsSuccess, result: listings } = listingsResponse;
  if (!listingsSuccess) {
    return listingsResponse;
  }

  const eligibleListings = listings.filter(listing => listing.quantity <= eligibleStockMax);

  if (!eligibleListings?.length) {
    return {
      success: true,
      result: 'No eligible listings found',
    };
  }

  console.log(eligibleListings.length);

  const responses = [];
  for (const listing of eligibleListings) {

    const { 
      listing_id: listingId, 
      inventory,
    } = listing;
    const { products } = inventory;

    const inventoryUpdatePayload = {
      products: products.map(({ offerings }) => ({
        offerings: offerings.map(({ price: { amount, divisor }, is_enabled, readiness_state_id }) => ({
          price: amount / divisor,
          is_enabled,
          readiness_state_id,
          quantity: randomNumber(replenishToMin, replenishToMax),
        })),
      })),
    };

    const response = await etsyListingInventoryUpdate(listingId, inventoryUpdatePayload, { credsPath });
    responses.push(response);
  }

  return arrayStandardResponse(responses);
};

const etsyListingsInventoryReplenishArbitraryApi = funcApi(etsyListingsInventoryReplenishArbitrary, {
  argNames: ['options'],
});

module.exports = {
  etsyListingsInventoryReplenishArbitrary,
  etsyListingsInventoryReplenishArbitraryApi,
};

// curl localhost:8000/etsyListingsInventoryReplenishArbitrary
// curl localhost:8000/etsyListingsInventoryReplenishArbitrary -H "Content-Type: application/json" -d '{ "options": { "eligibleStockMax": 4 } }'