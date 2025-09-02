const { funcApi, logDeep, randomNumber, arrayStandardResponse } = require('../utils');
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
    const inventoryUpdatePayload = {
      products: listing.inventory.products.map(({ offerings }) => { offerings.map(o => {
        return {
          quantity: randomNumber(replenishToMin, replenishToMax),
        };
      }) }),
    }
    const response = await etsyListingInventoryUpdate(listing.id, inventoryUpdatePayload, { credsPath });
    logDeep(response);
    await askQuestion('?');
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