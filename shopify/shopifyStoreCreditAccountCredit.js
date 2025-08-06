// https://shopify.dev/docs/api/admin-graphql/latest/mutations/storeCreditAccountCredit

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const shopifyStoreCreditAccountCredit = async (
  credsPath,
  {
    customerId,
    storeCreditAccountId,
  },
  amount,
  currencyCode,
  {
    apiVersion,
  } = {},
) => {

  const accountGid = customerId 
    ? `gid://shopify/Customer/${ customerId }` 
    : `gid://shopify/StoreCreditAccount/${ storeCreditAccountId }`;

  const mutationName = 'storeCreditAccountCredit';
  
  const mutation = `
    mutation ${ mutationName }($id: ID!, $creditInput: StoreCreditAccountCreditInput!) {
      ${ mutationName }(id: $id, creditInput: $creditInput) {
        storeCreditAccountTransaction {
          amount {
            amount
            currencyCode
          }
          account {
            id
            balance {
              amount
              currencyCode
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: accountGid,
    creditInput: {
      creditAmount: {
        amount,
        currencyCode,
      },
    },
  };

  const response = await shopifyClient.fetch({
    method: 'post',
    body: { query: mutation, variables },
    context: {
      credsPath,
      apiVersion,
    },
    interpreter: async (response) => {
      return {
        ...response,
        ...response.result ? {
          result: response.result[mutationName],
        } : {},
      };
    },
  });

  logDeep(response);
  return response;
};

const shopifyStoreCreditAccountCreditApi = async (req, res) => {
  const {
    credsPath,
    accountId,
    amount,
    currencyCode,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'accountId', accountId, p => objHasAny(p, ['customerId', 'storeCreditAccountId'])),
    mandateParam(res, 'amount', amount),
    mandateParam(res, 'currencyCode', currencyCode),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyStoreCreditAccountCredit(
    credsPath,
    accountId,
    amount,
    currencyCode,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyStoreCreditAccountCredit,
  shopifyStoreCreditAccountCreditApi,
};

// curl http://localhost:8000/shopifyStoreCreditAccountCredit -H 'Content-Type: application/json' -d '{ "credsPath": "au", "accountId": { "customerId": "8489669984328" }, "amount": 100, "currencyCode": "AUD" }'