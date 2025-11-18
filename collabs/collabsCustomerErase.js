const { funcApi } = require('../utils');
const { shopifyCustomerDelete } = require('../shopify/shopifyCustomerDelete');
const { shopifyCustomerRequestDataErasure } = require('../shopify/shopifyCustomerRequestDataErasure');
const { shopifyCustomerUpdate } = require('../shopify/shopifyCustomerUpdate');

const collabsCustomerErase = async (
  shopifyRegion,
  shopifyCustomerId,
  {
    option,
  } = {},
) => {

  // 1. Try deleting the customer from Shopify
  // TODO: Consider deleting from all stores
  // TODO: Support other Shopify customer identifiers, e.g. email

  let customerDeleted = false;

  const shopifyDeleteResponse = await shopifyCustomerDelete(shopifyRegion, shopifyCustomerId);

  const { 
    success: deleteSuccess,
    result: deleteResult,
  } = shopifyDeleteResponse;

  customerDeleted = deleteSuccess;

  // 2. If the delete fails, 
  // 2a. request data erasure
  // 2b. delete name, email, addresses, and unsubscribe from marketing

  if (!customerDeleted) {
    const shopifyRequestDataErasureResponse = await shopifyCustomerRequestDataErasure(shopifyRegion, shopifyCustomerId);    const { 
      success: requestDataErasureSuccess,
      result: requestDataErasureResult,
    } = shopifyRequestDataErasureResponse;

    if (!requestDataErasureSuccess) {
      return requestDataErasureResponse;
    }

    const customerUpdateResponse = await shopifyCustomerUpdate(shopifyRegion, shopifyCustomerId, {
      firstName: null,
      lastName: null,
      email: null,
      phone: null,
      addresses: [],
      acceptsMarketing: false,
      acceptsSmsMarketing: false,
    });

    const {
      success: updateSuccess,
      result: updateResult,
    } = customerUpdateResponse;

    if (!updateSuccess) {
      return customerUpdateResponse;
    }
  }

  // 3. Consider deleting from other platforms, e.g. Salesforce

  return {
    success: true,
    result,
  };
};

const collabsCustomerEraseApi = funcApi(collabsCustomerErase, {
  argNames: ['shopifyRegion', 'shopifyCustomerId', 'options'],
});

module.exports = {
  collabsCustomerErase,
  collabsCustomerEraseApi,
};

// curl localhost:8000/collabsCustomerErase -H "Content-Type: application/json" -d '{ "shopifyRegion": "au", "shopifyCustomerId": "9135184871496" }'