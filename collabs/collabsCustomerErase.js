const { funcApi } = require('../utils');

const collabsCustomerErase = async (
  shopifyCustomerId,
  {
    option,
  } = {},
) => {

  

  return true;
};

const collabsCustomerEraseApi = funcApi(collabsCustomerErase, {
  argNames: ['shopifyCustomerId', 'options'],
});

module.exports = {
  collabsCustomerErase,
  collabsCustomerEraseApi,
};

// curl localhost:8000/collabsCustomerErase -H "Content-Type: application/json" -d '{ "shopifyCustomerId": "8659387940936" }'