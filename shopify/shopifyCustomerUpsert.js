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
    tags = [],
    metafields,

    dateOfBirth,
    gender,
    emailConsent,
    smsConsent,
    stateAwareTags = [],

    // Overly specific business logic - omit for general use
    skipWelcomeJourney = false,

    returnAttrs,
    ...customerPayload
  },
  {
    apiVersion,
  } = {},
) => {

  const submittedMetafieldAttrs = metafields?.map(metafield => `mf_${ metafield.namespace }_${ metafield.key }: metafield(namespace: "${ metafield.namespace }", key: "${ metafield.key }") { value }`);

  const fetchAttrs = `${ attrs }${ submittedMetafieldAttrs ? ` ${ submittedMetafieldAttrs }` : '' }${ returnAttrs ? ` ${ returnAttrs }` : '' }`;
  
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

    if (stateAwareTags?.length) {
      tags.push(...stateAwareTags.map(tag => `created_${ tag }`));
    }

    if (skipWelcomeJourney) {
      tags.push('skip_welcome');
    }
    
    const customerCreatePayload = {
      // Native attributes
      ...(email && { email }),
      ...(phone && { phone }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(tags?.length && { tags }),

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

  if (stateAwareTags?.length) {
    tags.push(...stateAwareTags.map(tag => `updated_${ tag }`));
  }

  console.log('changes:');

  const firstNameRelevant = firstName && firstName !== shopifyCustomer.firstName;
  if (firstNameRelevant) {
    console.log(`firstName ${ firstName } vs ${ shopifyCustomer.firstName }`);
  }
  
  const lastNameRelevant = lastName && lastName !== shopifyCustomer.lastName;
  if (lastNameRelevant) {
    console.log(`lastName ${ lastName } vs ${ shopifyCustomer.lastName }`);
  }

  const phoneRelevant = phone && phone !== shopifyCustomer.phone;
  if (phoneRelevant) {
    console.log(`phone ${ phone } vs ${ shopifyCustomer.phone }`);
  }

  const emailRelevant = email && email !== shopifyCustomer.email;
  if (emailRelevant) {
    console.log(`email ${ email } vs ${ shopifyCustomer.email }`);
  }

  const tagsToAdd = tags.filter(tag => !shopifyCustomer.tags.includes(tag));
  const tagsRelevant = tagsToAdd?.length;
  if (tagsRelevant) {
    console.log(`tags to add: ${ tagsToAdd.join(', ') }`);
  }
  
  // TODO: Check if consent automatically changes if email/phone changes
  // When changing email, consent is reset to default - restore to the value from before the change
  const consentBooleanToState = (consentBoolean) => consentBoolean ? 'SUBSCRIBED' : 'UNSUBSCRIBED';
  const emailConsentState = consentBooleanToState(emailConsent);
  const smsConsentState = consentBooleanToState(smsConsent);

  // Email marketing consent
  const emailCurrentlySubscribed = shopifyCustomer?.defaultEmailAddress?.marketingState === 'SUBSCRIBED';
  const emailShouldBeSubscribed = !customNullish(emailConsent) ? emailConsent : emailCurrentlySubscribed;
  
  let emailConsentRelevant = false;
  if (
    (emailRelevant && emailShouldBeSubscribed) 
    || (!emailRelevant && (emailCurrentlySubscribed !== emailShouldBeSubscribed))
  ) {
    emailConsentRelevant = true;
  }

  if (emailConsentRelevant) {
    console.log(`emailConsent ${ emailConsentState } vs ${ shopifyCustomer?.defaultEmailAddress?.marketingState }`);
  }

  // SMS marketing consent
  const smsCurrentlySubscribed = shopifyCustomer?.defaultPhoneNumber?.marketingState === 'SUBSCRIBED';
  const smsShouldBeSubscribed = !customNullish(smsConsent) ? smsConsent : smsCurrentlySubscribed;
  
  let smsConsentRelevant = false;
  if (
    (phoneRelevant && smsShouldBeSubscribed) 
    || (!phoneRelevant && (smsCurrentlySubscribed !== smsShouldBeSubscribed))
  ) {
    smsConsentRelevant = true;
  }

  if (smsConsentRelevant) {
    console.log(`smsConsent ${ smsConsentState } vs ${ shopifyCustomer?.defaultPhoneNumber?.marketingState }`);
  }

  // Metafields
  const dateOfBirthRelevant = dateOfBirth && dateOfBirth !== shopifyCustomer?.mfDateOfBirth?.value;
  if (dateOfBirthRelevant) {
    console.log(`dateOfBirth ${ dateOfBirth } vs ${ shopifyCustomer?.mfDateOfBirth?.value }`);
  }
  
  const genderRelevant = gender && gender !== shopifyCustomer?.mfGender?.value;
  if (genderRelevant) {
    console.log(`gender ${ gender } vs ${ shopifyCustomer?.mfGender?.value }`);
  }

  const miscMetafieldsToUpdate = metafields?.filter(mf => {
    const { namespace, key, value: requestedValue } = mf;
    const currentValue = shopifyCustomer?.[`mf_${ namespace }_${ key }`]?.value;
    return currentValue !== requestedValue;
  });
  const miscMetafieldsRelevant = miscMetafieldsToUpdate?.length;
  if (miscMetafieldsToUpdate?.length) {
    console.log(`metafields to update: ${ miscMetafieldsToUpdate.map(mf => `${ mf.namespace }/${ mf.key }`).join(', ') }`);
  }

  const anyChanges = [
    firstNameRelevant,
    lastNameRelevant,
    phoneRelevant,
    emailRelevant,
    emailConsentRelevant,
    smsConsentRelevant,
    tagsRelevant,
    dateOfBirthRelevant,
    genderRelevant,
    miscMetafieldsRelevant,
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
  const updateResponses = {};

  const updatePayload = {
    ...(firstNameRelevant && { firstName }),
    ...(lastNameRelevant && { lastName }),
    ...(phoneRelevant && { phone }),
    ...(emailRelevant && { email }),
    ...((dateOfBirthRelevant || genderRelevant || miscMetafieldsRelevant) && { metafields: [
      ...(dateOfBirthRelevant ? [{
        namespace: 'facts',
        key: 'date_of_birth',
        value: dateOfBirth,
        type: 'date',
      }] : []),
      ...(genderRelevant ? [{
        namespace: 'facts',
        key: 'gender',
        value: gender,
        type: 'single_line_text_field',
      }] : []),
      ...(miscMetafieldsRelevant ? miscMetafieldsToUpdate : []),
    ]}),
  };
  
  if (!customNullish(updatePayload)) {
    console.log('Updating customer', updatePayload);
    const customerUpdateResponse = await shopifyCustomerUpdate(
      credsPath,
      gidToId(shopifyCustomer.id),
      updatePayload, 
      { 
        apiVersion, 
        returnAttrs: fetchAttrs,
      },
    );
    updateResponses.customerUpdate = customerUpdateResponse;
  }

  if (tagsRelevant) {
    console.log(`Adding tags ${ tagsToAdd.join(', ') }`);
    const tagsUpdateResponse = await shopifyTagsAdd(
      credsPath,
      shopifyCustomer.id,
      tagsToAdd,
      { apiVersion },
    );
    updateResponses.tagsUpdate = tagsUpdateResponse;
  }

  if (emailConsentRelevant) {
    console.log('Setting email consent to', emailShouldBeSubscribed);
    const emailConsentUpdateResponse = await shopifyCustomerMarketingConsentUpdateEmail(
      credsPath, 
      gidToId(shopifyCustomer.id), 
      consentBooleanToState(emailShouldBeSubscribed),
      { 
        marketingOptInLevel: 'SINGLE_OPT_IN',
        apiVersion,
      },
    );
    logDeep(emailConsentUpdateResponse);
    updateResponses.emailConsentUpdate = emailConsentUpdateResponse;
  }
  
  if (smsConsentRelevant) {
    console.log('Setting sms consent to', smsShouldBeSubscribed);
    const smsConsentUpdateResponse = await shopifyCustomerMarketingConsentUpdateSms(
      credsPath, 
      gidToId(shopifyCustomer.id), 
      consentBooleanToState(smsShouldBeSubscribed), 
      { 
        marketingOptInLevel: 'SINGLE_OPT_IN',
        apiVersion,
      },
    );
    logDeep(smsConsentUpdateResponse);
    updateResponses.smsConsentUpdate = smsConsentUpdateResponse;
  }
  
  const response = {
    ...arrayStandardResponse(Object.values(updateResponses), { flatten: true }),
    ...{ result: updateResponses },
  };
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
// curl http://localhost:8000/shopifyCustomerUpsert -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerPayload": { "email": "john+zodiac@whitefoxboutique.com", "firstName": "Ted", "lastName": "Cruz", "phone": "+61490789078", "smsConsent": true, "emailConsent": true, "dateOfBirth": "1980-01-01", "tags": ["skip_welcome", "hello_there"], "gender": "Prefer not to say" } }'
// curl http://localhost:8000/shopifyCustomerUpsert -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerPayload": { "email": "john+zodiac@whitefoxboutique.com", "smsConsent": true } }'
// curl http://localhost:8000/shopifyCustomerUpsert -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerPayload": { "customerId": "9004934594632", "email": "john+zodiackiller@whitefoxboutique.com" } }'
// curl http://localhost:8000/shopifyCustomerUpsert -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerPayload": { "customerId": "9004934594632", "dateOfBirth": "1999-10-10" } }'
// curl http://localhost:8000/shopifyCustomerUpsert -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerPayload": { "customerId": "9004934594632", "gender": "Whatever you into, sweet thang" } }'