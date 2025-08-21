// Creates or updates a customer account, including marketing etc.
// Based on shopifyCustomerUpdateDetails in pebl

const { funcApi, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');
const { shopifyCustomerGet } = require('../shopify/shopifyCustomerGet');

const shopifyCustomerUpsert = async (
  credsPath,
  customerPayload,
  {
    apiVersion,
    returnAttrs = 'id email firstName lastName',
  } = {},
) => {

  let shopifyCustomer;

  const {
    id: customerId,
    email,
    phone,
  } = customerPayload;
  
  // 1. Look up customer by ID - if ID was provided but no customer found, return failure
  if (customerId) {
    const customerGetResponse = await shopifyCustomerGet(credsPath, { customerId }, { apiVersion, returnAttrs });
    const { success, result } = customerGetResponse;
    if (!success) {
      return customerGetResponse;
    }

    if (!result) {
      return {
        success: false,
        error: ['No customer with ID'],
      };
    }

    shopifyCustomer = result;
  }

  // 2. Look up customer by email 
  if (!shopifyCustomer) {
    if (email) {
      const customerGetResponse = await shopifyCustomerGet(credsPath, { email }, { apiVersion, returnAttrs });
      const { success, result } = customerGetResponse;
      if (!success) {
        return customerGetResponse;
      }

      if (result) {
        shopifyCustomer = result;
      }      
    }
  }

  // TODO: Consider looking up by phone number

  // 3. If no customer found, create one

  // 4. Update anything that couldn't be included in the create call

  return {
    success: true,
    result: customer,
  };
};

const shopifyCustomerUpsertApi = funcApi(shopifyCustomerUpsert, { 
  argNames: ['credsPath', 'customerPayload', 'options'],
  // TODO: Require either identifiers to find customer or minimum for customer create
  validatorsByArg: { credsPath: Boolean, customerPayload: Boolean },
});

module.exports = {
  shopifyCustomerUpsert,
  shopifyCustomerUpsertApi,
};

// curl http://localhost:8000/shopifyCustomerUpsert -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerPayload": { "id": "8575963103304" } }'