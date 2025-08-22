// https://shopify.dev/docs/api/admin-graphql/latest/mutations/customersmsmarketingconsentupdate

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const defaultAttrs = `defaultPhoneNumber { marketingState }`;

const shopifyCustomerMarketingConsentUpdateSms = async (
  credsPath,
  customerId,
  marketingState, // SUBSCRIBED, UNSUBSCRIBED
  {
    apiVersion,
    returnAttrs = defaultAttrs,

    marketingOptInLevel = 'UNKNOWN', // CONFIRMED_OPT_IN, SINGLE_OPT_IN, UNKNOWN
    consentUpdatedAt,
    sourceLocationId,
  } = {},
) => {

  const customerGid = `gid://shopify/Customer/${ customerId }`;

  const response = await shopifyMutationDo(
    credsPath,
    'customerSmsMarketingConsentUpdate',
    {
      input: {
        type: 'CustomerSmsMarketingConsentUpdateInput!',
        value: {
          customerId: customerGid,
          smsMarketingConsent: {
            ...(marketingState && { marketingState }),
            ...(marketingOptInLevel && { marketingOptInLevel }),
            ...(consentUpdatedAt && { consentUpdatedAt }),
            ...(sourceLocationId && { sourceLocationId }),
          },
        },
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

const shopifyCustomerMarketingConsentUpdateSmsApi = async (req, res) => {
  const {
    credsPath,
    customerId,
    marketingState,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'customerId', customerId),
    mandateParam(res, 'marketingState', marketingState),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyCustomerMarketingConsentUpdateSms(
    credsPath,
    customerId,
    marketingState,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCustomerMarketingConsentUpdateSms,
  shopifyCustomerMarketingConsentUpdateSmsApi,
};

// curl http://localhost:8000/shopifyCustomerMarketingConsentUpdateSms -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerId": "8575963103304", "marketingState": "SUBSCRIBED" }'
// curl http://localhost:8000/shopifyCustomerMarketingConsentUpdateSms -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerId": "8575963103304", "marketingState": "UNSUBSCRIBED" }'