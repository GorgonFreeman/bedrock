// https://shopify.dev/docs/api/admin-graphql/latest/mutations/storeCreditAccountCredit

const { respond, mandateParam, logDeep, objHasAny, dateTimeFromNow } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

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
    expiresAt,
    timeToLive,
  } = {},
) => {

  let expiry = expiresAt;
  if (!expiry && timeToLive) {
    expiry = dateTimeFromNow({ plus: timeToLive });
  }

  const accountGid = customerId 
    ? `gid://shopify/Customer/${ customerId }` 
    : `gid://shopify/StoreCreditAccount/${ storeCreditAccountId }`;

  const mutationName = 'storeCreditAccountCredit';

  const mutationVariables = {
    id: {
      type: 'ID!',
      value: accountGid,
    },
    creditInput: {
      type: 'StoreCreditAccountCreditInput!',
      value: {
        creditAmount: {
          amount,
          currencyCode,
        },
        ...(expiry ? { expiresAt: expiry } : {}),
      },
    },
  };

  const returnSchema = `
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
  `;

  const response = await shopifyMutationDo(
    credsPath,
    mutationName,
    mutationVariables,
    returnSchema,
    {
      apiVersion,
    },
  );

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