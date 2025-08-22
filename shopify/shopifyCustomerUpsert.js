// Creates or updates a customer account, including marketing etc.
// Based on shopifyCustomerUpdateDetails in pebl

const { funcApi, logDeep, gidToId, arrayStandardResponse } = require('../utils');
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

  const fetchAttrs = `${ attrs }${ returnAttrs ? ` ${ returnAttrs }` : '' }`;
  
  // Not doing anything with the rest of customerPayload for now - will expand as we go
  logDeep(customerPayload);

  let shopifyCustomer;
  
  // 1. Look up customer by ID - if ID was provided but no customer found, return failure
  if (customerId) {
    const customerGetResponse = await shopifyCustomerGet(credsPath, { customerId }, { apiVersion, attrs: fetchAttrs });
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
    console.log('Found customer by ID');
  }

  // 2. Look up customer by email 
  if (!shopifyCustomer) {
    if (email) {
      const customerGetResponse = await shopifyCustomerGet(credsPath, { email }, { apiVersion, attrs: fetchAttrs });
      const { success, result } = customerGetResponse;
      if (!success) {
        return customerGetResponse;
      }

      if (result) {
        shopifyCustomer = result;
      }

      console.log(shopifyCustomer ? 'Found customer by email' : 'No customer found by email');
    }
  }

  // TODO: Consider looking up by phone number

  // 3. If no customer found, create one
  if (!shopifyCustomer) {

    console.log('Creating customer');
    
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

    const customerCreateResponse = await shopifyCustomerCreate(credsPath, customerCreatePayload, { apiVersion, attrs: returnAttrs });
    
    // const { success, result } = customerCreateResponse;    
    // if (!success) {
    //   return customerCreateResponse;
    // }
    // shopifyCustomer = result;

    // Currently nothing needs to be handled after creation, so return response directly
    return customerCreateResponse;
  }
  
  // At this point, it's definitely an update, as everything else can be handled during create
  // 4. Figure out what if anything has changed
  console.log('Comparing customer fetched with requested updates');
  logDeep(shopifyCustomer);

  const firstNameChanged = firstName !== shopifyCustomer.firstName;
  const lastNameChanged = lastName !== shopifyCustomer.lastName;
  const phoneChanged = phone !== shopifyCustomer.phone;
  const emailChanged = email !== shopifyCustomer.email;
  
  // TODO: Check if consent automatically changes if email/phone changes

  console.log('emailConsent', emailConsent ? 'SUBSCRIBED' : 'UNSUBSCRIBED', shopifyCustomer?.defaultEmailAddress?.marketingState);
  const emailConsentChanged = (emailConsent ? 'SUBSCRIBED' : 'UNSUBSCRIBED') !== shopifyCustomer?.defaultEmailAddress?.marketingState;

  console.log('smsConsent', smsConsent ? 'SUBSCRIBED' : 'UNSUBSCRIBED', shopifyCustomer?.defaultPhoneNumber?.marketingState);
  const smsConsentChanged = (smsConsent ? 'SUBSCRIBED' : 'UNSUBSCRIBED') !== shopifyCustomer?.defaultPhoneNumber?.marketingState;

  console.log(
    'changes:',
    firstNameChanged ? 'firstName' : '',
    lastNameChanged ? 'lastName' : '',
    phoneChanged ? 'phone' : '',
    emailChanged ? 'email' : '',
    emailConsentChanged ? 'emailConsent' : '',
    smsConsentChanged ? 'smsConsent' : '',
  );

  const anyChanges = [
    firstNameChanged,
    lastNameChanged,
    phoneChanged,
    emailChanged,
    emailConsentChanged,
    smsConsentChanged,
  ].some(Boolean);
  if (!anyChanges) {
    console.log('No changes to make');
    return {
      success: true,
      result: `No changes to make`,
    };
  }  
  // 5. Make updates
  console.log('Making updates');
  const updateResponses = [];

  const updatePayload = {
    ...(firstNameChanged && { firstName }),
    ...(lastNameChanged && { lastName }),
    ...(phoneChanged && { phone }),
    ...(emailChanged && { email }),
  };

  const customerUpdateResponse = await shopifyCustomerUpdate(
    credsPath,
    gidToId(shopifyCustomer.id),
    updatePayload, 
    { 
      apiVersion, 
      attrs: returnAttrs,
    },
  );
  updateResponses.push(customerUpdateResponse);

  if (emailConsentChanged) {
    const emailConsentUpdateResponse = await shopifyCustomerMarketingConsentUpdateEmail(
      credsPath, 
      gidToId(shopifyCustomer.id), 
      emailConsent ? 'SUBSCRIBED' : 'UNSUBSCRIBED',
      { 
        marketingOptInLevel: 'SINGLE_OPT_IN',
        apiVersion,
      },
    );
    logDeep(emailConsentUpdateResponse);
    updateResponses.push(emailConsentUpdateResponse);
  }
  
  if (smsConsentChanged) {
    const smsConsentUpdateResponse = await shopifyCustomerMarketingConsentUpdateSms(
      credsPath, 
      gidToId(shopifyCustomer.id), 
      smsConsent ? 'SUBSCRIBED' : 'UNSUBSCRIBED', 
      { 
        marketingOptInLevel: 'SINGLE_OPT_IN',
        apiVersion,
      },
    );
    logDeep(smsConsentUpdateResponse);
    updateResponses.push(smsConsentUpdateResponse);
  }
  
  const response = arrayStandardResponse(updateResponses);
  logDeep(response);
  return response;
};

const shopifyCustomerUpsertApi = funcApi(shopifyCustomerUpsert, { 
  argNames: ['credsPath', 'customerPayload', 'options'],  // TODO: Require either identifiers to find customer or minimum for customer create
  validatorsByArg: { credsPath: Boolean, customerPayload: Boolean },
});

module.exports = {
  shopifyCustomerUpsert,
  shopifyCustomerUpsertApi,
};

// curl http://localhost:8000/shopifyCustomerUpsert -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerPayload": { "customerId": "8575963103304" } }'
// curl http://localhost:8000/shopifyCustomerUpsert -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerPayload": { "email": "john+zodiac@whitefoxboutique.com", "firstName": "Ted", "lastName": "Cruz", "phone": "+61490789078", "smsConsent": true, "emailConsent": true, "birthDate": "1980-01-01", "tags": ["skip_welcome", "hello_there"], "gender": "Prefer not to say" } }'