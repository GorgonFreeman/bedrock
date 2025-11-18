const { funcApi } = require('../utils');

const collabsCustomerErase = async (
  shopifyCustomerId,
  {
    option,
  } = {},
) => {

  // 1. Try deleting the customer from Shopify
  // - all stores?

  // 2. If the delete fails, 
  // 2a. request data erasure
  // 2b. delete name, email, addresses, and unsubscribe from marketing

  // 3. Consider deleting from other platforms, e.g. Salesforce

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