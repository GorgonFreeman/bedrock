const { funcApi, logDeep } = require('../utils');

const etsyListingsInventoryReplenishArbitrary = async (
  {
    eligibleStockMax = 0,
    replenishToMax = 10,
    replenishToMin = 5,
    credsPath,
  } = {},
) => {
  const response = true;
  logDeep(response);
  return response;
};

const etsyListingsInventoryReplenishArbitraryApi = funcApi(etsyListingsInventoryReplenishArbitrary, {
  argNames: ['options'],
});

module.exports = {
  etsyListingsInventoryReplenishArbitrary,
  etsyListingsInventoryReplenishArbitraryApi,
};

// curl localhost:8000/etsyListingsInventoryReplenishArbitrary