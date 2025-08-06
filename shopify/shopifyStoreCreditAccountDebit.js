// https://shopify.dev/docs/api/admin-graphql/latest/mutations/storeCreditAccountDebit

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const shopifyStoreCreditAccountDebit = async (
  credsPath,
  accountGid,
  amount,
  currencyCode,
  {
    apiVersion,
  } = {},
) => {

  const mutationName = 'storeCreditAccountDebit';
  
  const mutation = `
    mutation ${ mutationName }($id: ID!, $debitInput: StoreCreditAccountDebitInput!) {
      ${ mutationName }(id: $id, debitInput: $debitInput) {
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
    debitInput: {
      debitAmount: {
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

const shopifyStoreCreditAccountDebitApi = async (req, res) => {
  const {
    credsPath,
    accountGid,
    amount,
    currencyCode,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'accountGid', accountGid),
    mandateParam(res, 'amount', amount),
    mandateParam(res, 'currencyCode', currencyCode),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyStoreCreditAccountDebit(
    credsPath,
    accountGid,
    amount,
    currencyCode,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyStoreCreditAccountDebit,
  shopifyStoreCreditAccountDebitApi,
};

// curl http://localhost:8000/shopifyStoreCreditAccountDebit -H 'Content-Type: application/json' -d '{ "credsPath": "au", "accountGid": "gid://shopify/Customer/8489669984328", "amount": 100, "currencyCode": "AUD" }'