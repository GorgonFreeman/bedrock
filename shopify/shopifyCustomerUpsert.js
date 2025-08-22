// Creates or updates a customer account, including marketing etc.
// Based on shopifyCustomerUpdateDetails in pebl

const { funcApi, logDeep } = require('../utils');
const { shopifyCustomerGet } = require('../shopify/shopifyCustomerGet');
const { shopifyCustomerCreate } = require('../shopify/shopifyCustomerCreate');
const { shopifyCustomerUpdate } = require('../shopify/shopifyCustomerUpdate');
const { shopifyCustomerMarketingConsentUpdateEmail } = require('../shopify/shopifyCustomerMarketingConsentUpdateEmail');
const { shopifyCustomerMarketingConsentUpdateSms } = require('../shopify/shopifyCustomerMarketingConsentUpdateSms');

const attrs = `
  id 
  email
  phone
  firstName 
  lastName
  tags
  defaultEmailAddress { marketingState }
  defaultPhoneNumber { marketingState }
`;

const shopifyCustomerUpsert = async (
  credsPath,
  {
    customerId,
    email,
    phone,
    firstName,
    lastName,
    tags,
    metafields,

    birthDate,
    gender,
    emailConsent,
    smsConsent,

    returnAttrs,
    ...customerPayload
  },
  {
    apiVersion,
  } = {},
) => {

  const fetchAttrs = `${ attrs } ${ returnAttrs }`;
  
  // Not doing anything with the rest of customerPayload for now - will expand as we go
  logDeep(customerPayload);

  let shopifyCustomer;
  
  // 1. Look up customer by ID - if ID was provided but no customer found, return failure
  if (customerId) {
    const customerGetResponse = await shopifyCustomerGet(credsPath, { customerId }, { apiVersion, fetchAttrs });
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
      const customerGetResponse = await shopifyCustomerGet(credsPath, { email }, { apiVersion, fetchAttrs });
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
  if (!shopifyCustomer) {
    
    const customerCreatePayload = {
      // Native attributes
      ...(email && { email }),
      ...(phone && { phone }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(tags && { tags }),

      // Custom attributes
      ...(email && emailConsent && { emailMarketingConsent: {
        marketingOptInLevel: 'SINGLE_OPT_IN',
        marketingState: 'SUBSCRIBED',
      }}),

      ...(phone && smsConsent && { smsMarketingConsent: {
        marketingOptInLevel: 'SINGLE_OPT_IN',
        marketingState: 'SUBSCRIBED',
      }}),
      
      ...((metafields || birthDate || gender) && { metafields: [
        ...(metafields || []),
        ...(birthDate ? [{
          namespace: 'facts',
          key: 'birth_date',
          value: birthDate,
          type: 'date',
        }] : []),
        ...(gender ? [{
          namespace: 'facts',
          key: 'gender',
          value: gender,
          type: 'single_line_text_field',
        }] : []),
      ]}),
    };

    const customerCreateResponse = await shopifyCustomerCreate(credsPath, customerCreatePayload, { apiVersion, fetchAttrs });
    const { success, result } = customerCreateResponse;
    
    // if (!success) {
    //   return customerCreateResponse;
    // }
    // shopifyCustomer = result;

    // Currently nothing needs to be handled after creation, so return response directly
    return customerCreateResponse;
  }
  
  // At this point, it's definitely an update, as everything else can be handled during create
  // 4. Figure out what if anything has changed
  logDeep(shopifyCustomer);
  logDeep(customerPayload);

  // 5. Make updates


  return {
    success: true,
    result: shopifyCustomer,
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

// curl http://localhost:8000/shopifyCustomerUpsert -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerPayload": { "customerId": "8575963103304" } }'
// curl http://localhost:8000/shopifyCustomerUpsert -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerPayload": { "email": "john+zodiac@whitefoxboutique.com", "firstName": "Ted", "lastName": "Cruz", "phone": "+61490789078", "smsConsent": true, "emailConsent": true, "birthDate": "1980-01-01", "tags": ["skip_welcome", "hello_there"], "gender": "Prefer not to say" } }'