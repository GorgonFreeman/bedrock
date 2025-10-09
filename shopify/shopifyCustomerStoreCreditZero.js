const { respond, mandateParam, logDeep, gidToId, askQuestion, arrayStandardResponse, actionMultipleOrSingle, funcApi } = require('../utils');
const { shopifyCustomerGet } = require('../shopify/shopifyCustomerGet');
const { shopifyStoreCreditAccountDebit } = require('../shopify/shopifyStoreCreditAccountDebit');

const storeCreditAttrs = `
  storeCreditAccounts(first: 10) {
    edges {
      node {
        id
        balance {
          amount
          currencyCode
        }
      }
    }
  }
`;

const shopifyCustomerStoreCreditZeroSingle = async (
  credsPath,
  customerId,
  {
    apiVersion,
    interactive,
  } = {},
) => {

  // 1. Get all store credit accounts for customer
  const customerResponse = await shopifyCustomerGet(
    credsPath,
    { customerId },
    {
      apiVersion,
      attrs: `id ${ storeCreditAttrs }`,
    },
  );

  if (!customerResponse?.success || !customerResponse?.result) {
    return customerResponse;
  }

  const customer = customerResponse.result;
  const { storeCreditAccounts } = customer;
  
  if (interactive) {
    console.log('storeCreditAccounts', Object.values(storeCreditAccounts));
    await askQuestion('Continue?');
  }

  const results = [];

  // 2. Process each store credit account
  // TODO: Why is this an object instead of an array?
  for (const account of Object.values(storeCreditAccounts)) {
    const { id: accountGid, balance } = account;
    
    console.log('account', account);
    console.log('balance', balance?.amount);

    // Skip if no balance or balance is 0
    if (!balance?.amount || parseFloat(balance.amount) <= 0) {
      continue;
    }

    // Remove all store credit from this account
    const debitResponse = await shopifyStoreCreditAccountDebit(
      credsPath,
      { storeCreditAccountId: gidToId(accountGid) },
      balance.amount,
      balance.currencyCode,
      { apiVersion },
    );

    results.push(debitResponse);
  }

  const arrayResponse = arrayStandardResponse(results);
  // logDeep(arrayResponse);
  return arrayResponse;
};

const shopifyCustomerStoreCreditZero = async (
  credsPath,
  customerId,
  {
    apiVersion,
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    customerId, 
    shopifyCustomerStoreCreditZeroSingle, 
    (customerId) => ({
      args: [credsPath, customerId],
      options: { apiVersion },
    }),
  );
  logDeep(response);
  return response;
};

const shopifyCustomerStoreCreditZeroApi = funcApi(shopifyCustomerStoreCreditZero, {
  argNames: ['credsPath', 'customerId', 'options'],
  allowCrossOrigin: true,
});

module.exports = {
  shopifyCustomerStoreCreditZero,
  shopifyCustomerStoreCreditZeroApi,
};

// curl http://localhost:8000/shopifyCustomerStoreCreditZero -H 'Content-Type: application/json' -d '{ "credsPath": "au", "customerId": "8489669984328" }' 