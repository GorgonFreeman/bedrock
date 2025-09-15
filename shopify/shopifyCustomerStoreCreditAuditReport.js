const { respond, mandateParam, logDeep } = require('../utils');

const { REGIONS_WF } = require('./shopify.constants');
const { shopifyConversionRatesGetStored } = require('../shopify/shopifyConversionRatesGetStored');
const { shopifyCustomerSegmentMembersGet } = require('../shopify/shopifyCustomerSegmentMembersGet');
const { shopifyCustomerGet } = require('../shopify/shopifyCustomerGet');

const shopifyCustomerStoreCreditAuditReport = async (
  {
    credsPaths = REGIONS_WF,
    apiVersion,
    exempt = true,
  } = {},
) => {

  const customerSegmentName = 'Store Credit Check';
  const exemptTag = 'store_credit_exempt';
  let totalExemptCount = 0;

  const regionalResult = {};
  
  // Process each region
  for (const credsPath of credsPaths) {
    const customersWithExcessStoreCredit = [];
    
    // 1. Get region-specific conversion rates from Shopify
    const conversionRatesResult = await shopifyConversionRatesGetStored(credsPath);
    if (!conversionRatesResult.success) {
      logDeep(`Error getting conversion rates for ${ credsPath }: ${ conversionRatesResult.error }`);
      regionalResult[credsPath] = {
        success: false,
        error: ['No conversion rates found'],
      };
      continue;
    }
    const conversionRates = conversionRatesResult.result;
    if (!conversionRates) {
      logDeep(`Error getting conversion rates for ${ credsPath }: ${ conversionRatesResult.error }`);
      regionalResult[credsPath] = {
        success: false,
        error: ['No conversion rates found'],
      };
      continue;
    }
    logDeep(`Conversion rates for ${ credsPath }:`, conversionRates);

    // 2. Get customers from segmentMembersGet
    const segmentMembersResult = await shopifyCustomerSegmentMembersGet(credsPath, customerSegmentName);
    if (!segmentMembersResult.success) {
      logDeep(`Error getting segment members for ${ credsPath }: ${ segmentMembersResult.error }`);
      regionalResult[credsPath] = {
        success: false,
        error: ['No segment members found'],
      };
      continue;
    }
    
    // 3. Process each customer
    const segmentMembers = segmentMembersResult.result.items;
    const customerErrors = [];
    for (const customer of segmentMembers) {
      const { id, firstName, lastName, defaultEmailAddress } = customer;
      const { emailAddress } = defaultEmailAddress;
      const attrs = `id email tags displayName storeCreditAccounts (first:5) { edges { node { id balance { amount currencyCode } } } }`;

      // Get customer details from segmentMembers
      const customerResult = await shopifyCustomerGet(credsPath, { email: emailAddress }, { apiVersion, attrs });
      if (!customerResult.success) {
        logDeep(`Error getting customer details for ${ emailAddress }: ${ customerResult.error }`);
        customerErrors.push(`Error getting customer details for ${ emailAddress }: ${ customerResult.error }`);
        continue;
      }
      
      // Check if customer has excess store credit
      const shopifyCustomer = customerResult.result;
      const { id: customerId, email: customerEmail, displayName: customerDisplayName, tags, storeCreditAccounts } = shopifyCustomer;

      // Check if customer is exempt
      if (exempt && tags.includes(exemptTag)) {
        totalExemptCount++;
        continue;
      }

      // Check if customer has store credit accounts
      if (!storeCreditAccounts || storeCreditAccounts.length === 0) {
        console.log(`No store credit accounts found for ${ emailAddress }`);
        customerErrors.push(`No store credit accounts found for ${ emailAddress }`);
        continue;
      }

      // Check each store credit account, but there should only be one
      for (const storeCreditAccount of storeCreditAccounts) {
        const { id: storeCreditAccountId, balance } = storeCreditAccount;
        const { amount, currencyCode } = balance;

        // Calculate amount to try and covert to AUD
        const [ calculatedAmount, calculatedCurrencyCode ] = convertCurrencies(credsPath, amount, currencyCode, conversionRates);
        console.log(`${ emailAddress }: ${ amount } ${ currencyCode } -> ${ calculatedAmount } ${ calculatedCurrencyCode }`);
      }
    }
  }
  return ;
};

const convertCurrencies = (credsPath,amount, currencyCode, conversionRates) => {
  const amountFloat = parseFloat(amount);

  // If amountFloat is 0, return 0 to avoid NaN
  if (amountFloat === 0) {
    return [ '0.00', currencyCode ];
  }

  // If the currency is AUD, just return the amount as is regardless of the config
  if ( currencyCode === 'AUD') {
    return [ amountFloat.toFixed(2), currencyCode ];
  }

  // If the credsPath is AU, convert to AUD as all conversion rates are from AUD
  if ( credsPath === 'au' ) {
    const conversionRate = conversionRates[currencyCode];
    if (!conversionRate || conversionRate === 0) {
      return [ amountFloat.toFixed(2), currencyCode ]; // Return original if no valid conversion rate
    }
    return [ (amountFloat / conversionRate).toFixed(2), 'AUD' ];
  }

  // Convert from any currency to USD and then to AUD, as all conversion rates are from USD to other currencies
  if ( credsPath === 'us' ) {
    if ( currencyCode === 'USD' ) {
      const audConversionRate = conversionRates['AUD'];
      if (!audConversionRate || audConversionRate === 0) {
        return [ amountFloat.toFixed(2), currencyCode ]; // Return original if no valid conversion rate
      }
      return [ (amountFloat * audConversionRate).toFixed(2), 'AUD' ];
    }
    const fromCurrencyRate = conversionRates[currencyCode];
    const audConversionRate = conversionRates['AUD'];
    if (!fromCurrencyRate || fromCurrencyRate === 0 || !audConversionRate || audConversionRate === 0) {
      return [ amountFloat.toFixed(2), currencyCode ]; // Return original if no valid conversion rates
    }
    const amountInUSD = amountFloat / fromCurrencyRate;
    const amountInAUD = amountInUSD * audConversionRate;
    return [ amountInAUD.toFixed(2), 'AUD' ];
  }

  // Convert from any currency to GBP and then to AUD, as all conversion rates are from GBP to other currencies
  if ( credsPath === 'uk' ) {
    if ( currencyCode === 'GBP' ) {
      const audConversionRate = conversionRates['AUD'];
      if (!audConversionRate || audConversionRate === 0) {
        return [ amountFloat.toFixed(2), currencyCode ]; // Return original if no valid conversion rate
      }
      return [ (amountFloat * audConversionRate).toFixed(2), 'AUD' ];
    }
    const fromCurrencyRate = conversionRates[currencyCode];
    if (!fromCurrencyRate || fromCurrencyRate === 0) {
      return [ amountFloat.toFixed(2), currencyCode ]; // Return original if no valid conversion rate
    }
    const amountInGBP = amountFloat / fromCurrencyRate;
    // Just report GBP as AUD conversion is not available
    return [ amountInGBP.toFixed(2), 'GBP' ];
  }

  return [ amountFloat.toFixed(2), currencyCode ];
};

const shopifyCustomerStoreCreditAuditReportApi = async (req, res) => {
  const { 
    options,
  } = req.body;
  const result = await shopifyCustomerStoreCreditAuditReport(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCustomerStoreCreditAuditReport,
  shopifyCustomerStoreCreditAuditReportApi,
};

// curl localhost:8000/shopifyCustomerStoreCreditAuditReport
// curl localhost:8000/shopifyCustomerStoreCreditAuditReport -H "Content-Type: application/json" -d '{ "options": { "credsPaths": [ "au" ] } }'
// curl localhost:8000/shopifyCustomerStoreCreditAuditReport -H "Content-Type: application/json" -d '{ "options": { "credsPaths": [ "us" ] } }'
// curl localhost:8000/shopifyCustomerStoreCreditAuditReport -H "Content-Type: application/json" -d '{ "options": { "credsPaths": [ "uk" ] } }'