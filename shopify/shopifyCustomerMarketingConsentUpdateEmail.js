// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customeremailmarketingconsentupdate

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `defaultEmailAddress { marketingState }`;

const shopifyCustomerMarketingConsentUpdateEmail = async (
  credsPath,
  consentInput,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyMutationDo(
    credsPath,
    'customerEmailMarketingConsentUpdate',
    {
      input: {
        type: 'CustomerEmailMarketingConsentUpdateInput!',
        value: consentInput,
      },
    },
    `customer { ${ returnAttrs } }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return response;
};

const shopifyCustomerMarketingConsentUpdateEmailApi = async (req, res) => {
  const {
    credsPath,
    consentInput,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'consentInput', consentInput),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyCustomerMarketingConsentUpdateEmail(
    credsPath,
    consentInput,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCustomerMarketingConsentUpdateEmail,
  shopifyCustomerMarketingConsentUpdateEmailApi,
};

// curl http://localhost:8000/shopifyCustomerMarketingConsentUpdateEmail -H 'Content-Type: application/json' -d '{ "credsPath": "au", "consentInput": { "customerId": "gid://shopify/Customer/8575963103304", "emailMarketingConsent": { "marketingState": "SUBSCRIBED", "marketingOptInLevel": "SINGLE_OPT_IN" } } }'
// curl http://localhost:8000/shopifyCustomerMarketingConsentUpdateEmail -H 'Content-Type: application/json' -d '{ "credsPath": "au", "consentInput": { "customerId": "gid://shopify/Customer/8575963103304", "emailMarketingConsent": { "marketingState": "UNSUBSCRIBED" } } }'