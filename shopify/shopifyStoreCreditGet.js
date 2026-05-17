// https://shopify.dev/docs/api/admin-graphql/latest/queries/storeCreditAccount

const { funcApi, logDeep, actionMultipleOrSingle } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `
  id
  balance {
    amount
    currencyCode
  }
  owner {
    ... on Customer {
      id
      email
      tags
    }
  }
  transactions(first: 250, sortKey: CREATED_AT, reverse: true) {
    edges {
      node {
        __typename
        amount {
          amount
          currencyCode
        }
        balanceAfterTransaction {
          amount
          currencyCode
        }
        createdAt
        event
        origin {
          __typename
          ... on OrderTransaction {
            id
            parentTransaction {
              id
            }
          }
        }
        ... on StoreCreditAccountCreditTransaction {
          id
          expiresAt
          remainingAmount {
            amount
            currencyCode
          }
        }
        ... on StoreCreditAccountDebitTransaction {
          id
        }
        ... on StoreCreditAccountDebitRevertTransaction {
          id
          debitTransaction {
            id
          }
        }
        ... on StoreCreditAccountExpirationTransaction {
          creditTransaction {
            id
          }
        }
      }
    }
  }
`;

const shopifyStoreCreditGetSingle = async (
  credsPath,
  storeCreditAccountId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyGetSingle(
    credsPath,
    'storeCreditAccount',
    storeCreditAccountId,
    {
      apiVersion,
      attrs,
    },
  );

  logDeep(response);
  return response;
};

const shopifyStoreCreditGet = async (
  credsPath,
  storeCreditAccountId,
  {
    queueRunOptions,
    ...options
  } = {},
) => {
  const response = await actionMultipleOrSingle(
    storeCreditAccountId,
    shopifyStoreCreditGetSingle,
    (storeCreditAccountId) => ({
      args: [credsPath, storeCreditAccountId],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );

  logDeep(response);
  return response;
};

const shopifyStoreCreditGetApi = funcApi(shopifyStoreCreditGet, {
  argNames: ['credsPath', 'storeCreditAccountId', 'options'],
});

module.exports = {
  shopifyStoreCreditGet,
  shopifyStoreCreditGetSingle,
  shopifyStoreCreditGetApi,
};

// curl localhost:8000/shopifyStoreCreditGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "storeCreditAccountId": "669614221" }'
