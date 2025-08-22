// Creates or updates a customer account, including marketing etc.
// Based on shopifyCustomerUpdateDetails in pebl

const { funcApi, logDeep, gidToId, arrayStandardResponse, customNullish } = require('../utils');
const { shopifyCustomerGet } = require('../shopify/shopifyCustomerGet');
const { shopifyCustomerCreate } = require('../shopify/shopifyCustomerCreate');
const { shopifyCustomerUpdate } = require('../shopify/shopifyCustomerUpdate');
const { shopifyCustomerMarketingConsentUpdateEmail } = require('../shopify/shopifyCustomerMarketingConsentUpdateEmail');
const { shopifyCustomerMarketingConsentUpdateSms } = require('../shopify/shopifyCustomerMarketingConsentUpdateSms');
const { shopifyTagsAdd } = require('../shopify/shopifyTagsAdd');

// TODO: Compose fetch attrs based on requested updates
const attrs = `
  id 
  email
  phone
  firstName 
  lastName
  tags
  defaultEmailAddress { marketingState }
  defaultPhoneNumber { marketingState }
  mfDateOfBirth: metafield(namespace: "facts", key: "date_of_birth") {
    value
  }
  mfGender: metafield(namespace: "facts", key: "gender") {
    value
  }
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

    dateOfBirth,
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
      
      ...((metafields || dateOfBirth || gender) && { metafields: [
        ...(metafields || []),
        ...(dateOfBirth ? [{
          namespace: 'facts',
          key: 'birth_date',
          value: dateOfBirth,
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

  console.log('changes:');

  const firstNameChanged = firstName && firstName !== shopifyCustomer.firstName;
  if (firstNameChanged) {
    console.log(`firstName ${ firstName } vs ${ shopifyCustomer.firstName }`);
  }
  
  const lastNameChanged = lastName && lastName !== shopifyCustomer.lastName;
  if (lastNameChanged) {
    console.log(`lastName ${ lastName } vs ${ shopifyCustomer.lastName }`);
  }

  const phoneChanged = phone && phone !== shopifyCustomer.phone;
  if (phoneChanged) {
    console.log(`phone ${ phone } vs ${ shopifyCustomer.phone }`);
  }

  const emailChanged = email && email !== shopifyCustomer.email;
  if (emailChanged) {
    console.log(`email ${ email } vs ${ shopifyCustomer.email }`);
  }

  const tagsToAdd = tags && tags.filter(tag => !shopifyCustomer.tags.includes(tag));
  const tagsChanged = tagsToAdd?.length;
  if (tagsChanged) {
    console.log(`tags to add: ${ tagsToAdd.join(', ') }`);
  }
  
  // TODO: Check if consent automatically changes if email/phone changes
  // When changing email, consent is reset to default - restore to the value from before the change
  const consentBooleanToState = (consentBoolean) => consentBoolean ? 'SUBSCRIBED' : 'UNSUBSCRIBED';
  const emailConsentState = consentBooleanToState(emailConsent);
  const smsConsentState = consentBooleanToState(smsConsent);

  const consentNeedsUpdating = (consentState, currentState) => {
    if (consentState === 'SUBSCRIBED') {
      return currentState !== 'SUBSCRIBED';
    }

    if (consentState === 'UNSUBSCRIBED') {
      const unsubscribedStates = ['UNSUBSCRIBED', 'NOT_SUBSCRIBED'];
      return !unsubscribedStates.includes(currentState);
    }

    return true;
  };

  const emailConsentChanged = consentNeedsUpdating(emailConsentState, shopifyCustomer?.defaultEmailAddress?.marketingState);
  if (emailConsentChanged) {
    console.log(`emailConsent ${ emailConsentState } vs ${ shopifyCustomer?.defaultEmailAddress?.marketingState }`);
  }

  const smsConsentChanged = consentNeedsUpdating(smsConsentState, shopifyCustomer?.defaultPhoneNumber?.marketingState);
  if (smsConsentChanged) {
    console.log(`smsConsent ${ smsConsentState } vs ${ shopifyCustomer?.defaultPhoneNumber?.marketingState }`);
  }

  // Metafields
  const dateOfBirthChanged = dateOfBirth && dateOfBirth !== shopifyCustomer?.mfDateOfBirth?.value;
  // if (dateOfBirthChanged) {    console.log(`dateOfBirth ${ dateOfBirth } vs ${ shopifyCustomer?.mfDateOfBirth?.value }`);
  // }
  
  const genderChanged = gender && gender !== shopifyCustomer?.mfGender?.value;
  // if (genderChanged) {
    console.log(`gender ${ gender } vs ${ shopifyCustomer?.mfGender?.value }`);
  // }
  const anyChanges = [
    firstNameChanged,
    lastNameChanged,
    phoneChanged,
    emailChanged,
    emailConsentChanged,
    smsConsentChanged,
    tagsChanged,
    dateOfBirthChanged,
    genderChanged,
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
    ...((dateOfBirthChanged || genderChanged) && { metafields: [
      ...(dateOfBirthChanged ? [{
        namespace: 'facts',
        key: 'date_of_birth',
        value: dateOfBirth,
        type: 'date',
      }] : []),
      ...(genderChanged ? [{
        namespace: 'facts',
        key: 'gender',
        value: gender,
        type: 'single_line_text_field',
      }] : []),
    ]}),
  };
  
  if (!customNullish(updatePayload)) {
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
  }

  if (tagsChanged) {
    const tagsUpdateResponse = await shopifyTagsAdd(
      credsPath,
      shopifyCustomer.id,
      tagsToAdd,
      { apiVersion },
    );
    updateResponses.push(tagsUpdateResponse);
  }

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
// curl http://localhost:8000/shopifyCustomerUpsert -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerPayload": { "email": "john+zodiac@whitefoxboutique.com", "emailConsent": true } }'