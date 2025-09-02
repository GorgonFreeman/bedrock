const { funcApi, logDeep } = require('../utils');
const { etsyShopListingsGet } = require('../etsy/etsyShopListingsGet');

const etsyListingsInventoryReplenishArbitrary = async (
  {
    eligibleStockMax = 0,
    replenishToMax = 10,
    replenishToMin = 5,
    credsPath,
  } = {},
) => {

  const listingsResponse = await etsyShopListingsGet({ credsPath });
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
  
  return true;
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