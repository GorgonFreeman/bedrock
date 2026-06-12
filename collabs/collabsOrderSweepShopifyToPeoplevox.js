const { funcApi } = require('../utils');

const collabsOrderSweepShopifyToPeoplevox = async (
  arg,
  {
    option,
  } = {},
) => {

  return { 
    arg, 
    option,
  };
  
};

const collabsOrderSweepShopifyToPeoplevoxApi = funcApi(collabsOrderSweepShopifyToPeoplevox, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsOrderSweepShopifyToPeoplevox,
  collabsOrderSweepShopifyToPeoplevoxApi,
};

// curl localhost:8000/collabsOrderSweepShopifyToPeoplevox -H "Content-Type: application/json" -d '{ "arg": "1234" }'