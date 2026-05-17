// https://shopify.dev/docs/api/admin-graphql/latest/queries/storeCreditAccount

const { REGIONS_WF } = require('../constants');
const { funcApi, logDeep, gidToId, arrayToChunks, days, dateTimeFromNow } = require('../utils');

const { shopifyBulkOperationDo } = require('../shopify/shopifyBulkOperationDo');
const { shopifyStoreCreditGetSingle } = require('../shopify/shopifyStoreCreditGet');
const { googlesheetsSpreadsheetSheetAdd } = require('../googlesheets/googlesheetsSpreadsheetSheetAdd');

const STAFF_TAG = 'group:staff';

// Bulk operations cap at 2 nested connections, so transactions are fetched per-account in a follow-up step.
const bulkAccountsQuery = `
{
  customers {
    edges {
      node {
        id
        email
        tags
        storeCreditAccounts {
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
      }
    }
  }
}
`;

const transactionsAttrs = `
  id
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

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const flattenAccountToRows = ({
  region,
  customer,
  account,
  transactions,
}) => {
  const {
    id: customerGid,
    email,
    tags = [],
  } = customer || {};
  const {
    id: accountGid,
    balance,
  } = account || {};

  const isStaff = (tags || []).includes(STAFF_TAG);

  const customerId = customerGid ? gidToId(customerGid) : null;
  const accountId = accountGid ? gidToId(accountGid) : null;
  const accountBalance = toNumber(balance?.amount);
  const currency = balance?.currencyCode || null;

  if (!transactions?.length) {
    return [{
      region,
      customerId,
      email: email || null,
      isStaff,
      accountId,
      accountBalance,
      currency,
      txType: null,
      txCreatedAt: null,
      txAmount: null,
      txCurrency: null,
      balanceAfter: null,
      event: null,
      expiresAt: null,
      remainingAmount: null,
      originType: null,
      originOrderTransactionId: null,
      linkedDebitOrCreditId: null,
    }];
  }

  return transactions.map(tx => {
    const {
      __typename: txType,
      id: txGid,
      amount: txAmount,
      balanceAfterTransaction,
      createdAt,
      event,
      origin,
      expiresAt,
      remainingAmount,
      debitTransaction,
      creditTransaction,
    } = tx || {};

    const originOrderTransactionId = origin?.__typename === 'OrderTransaction' && origin?.id 
      ? gidToId(origin.id) 
      : null;

    const linkedDebitOrCreditGid = debitTransaction?.id || creditTransaction?.id || null;
    const linkedDebitOrCreditId = linkedDebitOrCreditGid ? gidToId(linkedDebitOrCreditGid) : null;

    return {
      region,
      customerId,
      email: email || null,
      isStaff,
      accountId,
      accountBalance,
      currency,
      txType: txType || null,
      txId: txGid ? gidToId(txGid) : null,
      txCreatedAt: createdAt || null,
      txAmount: toNumber(txAmount?.amount),
      txCurrency: txAmount?.currencyCode || null,
      balanceAfter: toNumber(balanceAfterTransaction?.amount),
      event: event || null,
      expiresAt: expiresAt || null,
      remainingAmount: remainingAmount?.amount !== undefined ? toNumber(remainingAmount.amount) : null,
      originType: origin?.__typename || null,
      originOrderTransactionId,
      linkedDebitOrCreditId,
    };
  });
};

const buildSummary = (ledger, { expiringWithinDays }) => {

  const expiringThreshold = dateTimeFromNow({ plus: days(expiringWithinDays) });

  const accountsSeen = new Map();
  const txAggregatesByAccount = new Map();
  const byCreditReasonCount = {};
  const byCreditReasonAmount = {};
  const byCurrencyOutstanding = {};
  const staffVsCustomerTotals = { staff: 0, customer: 0 };

  let lifetimeCreditedTotal = 0;
  let lifetimeDebitedTotal = 0;
  let lifetimeExpiredTotal = 0;
  let lifetimeRevertedTotal = 0;
  let expiringWithinNDaysTotal = 0;

  for (const row of ledger) {
    const {
      accountId,
      accountBalance,
      currency,
      isStaff,
      txType,
      txAmount,
      expiresAt,
      remainingAmount,
      originType,
    } = row;

    if (accountId && !accountsSeen.has(accountId)) {
      accountsSeen.set(accountId, { balance: accountBalance, currency, isStaff });
      if (accountBalance > 0) {
        staffVsCustomerTotals[isStaff ? 'staff' : 'customer'] += accountBalance;
        if (currency) {
          byCurrencyOutstanding[currency] = (byCurrencyOutstanding[currency] || 0) + accountBalance;
        }
      }
      txAggregatesByAccount.set(accountId, { credited: 0, debited: 0, expired: 0, reverted: 0 });
    }

    if (!txType) {
      continue;
    }

    const txAggregates = txAggregatesByAccount.get(accountId);

    if (txType === 'StoreCreditAccountCreditTransaction') {
      lifetimeCreditedTotal += txAmount;
      txAggregates.credited += txAmount;

      const reasonKey = originType || 'mutation';
      byCreditReasonCount[reasonKey] = (byCreditReasonCount[reasonKey] || 0) + 1;
      byCreditReasonAmount[reasonKey] = (byCreditReasonAmount[reasonKey] || 0) + txAmount;

      if (expiresAt && remainingAmount && remainingAmount > 0) {
        const expiresAtDate = new Date(expiresAt);
        if (expiresAtDate <= expiringThreshold) {
          expiringWithinNDaysTotal += remainingAmount;
        }
      }
    } else if (txType === 'StoreCreditAccountDebitTransaction') {
      lifetimeDebitedTotal += Math.abs(txAmount);
      txAggregates.debited += Math.abs(txAmount);
    } else if (txType === 'StoreCreditAccountExpirationTransaction') {
      lifetimeExpiredTotal += Math.abs(txAmount);
      txAggregates.expired += Math.abs(txAmount);
    } else if (txType === 'StoreCreditAccountDebitRevertTransaction') {
      lifetimeRevertedTotal += txAmount;
      txAggregates.reverted += txAmount;
    }
  }

  const anomalies = [];

  for (const [accountId, { balance, currency, isStaff }] of accountsSeen) {
    const txAggregates = txAggregatesByAccount.get(accountId) || { credited: 0, debited: 0, expired: 0, reverted: 0 };
    const expected = txAggregates.credited - txAggregates.debited - txAggregates.expired + txAggregates.reverted;
    const drift = Math.round((balance - expected) * 100) / 100;

    if (Math.abs(drift) >= 0.01) {
      anomalies.push({
        type: 'balance_drift',
        accountId,
        isStaff,
        currency,
        balance,
        expected: Math.round(expected * 100) / 100,
        drift,
      });
    }

    if (balance > 0 && txAggregates.credited <= 0) {
      anomalies.push({
        type: 'balance_without_credits',
        accountId,
        isStaff,
        currency,
        balance,
      });
    }
  }

  const outstandingTotal = Object.values(byCurrencyOutstanding).reduce((sum, n) => sum + n, 0);

  return {
    accountsCount: accountsSeen.size,
    ledgerRowsCount: ledger.length,
    outstandingTotal: Math.round(outstandingTotal * 100) / 100,
    byCurrencyOutstanding,
    lifetimeCreditedTotal: Math.round(lifetimeCreditedTotal * 100) / 100,
    lifetimeDebitedTotal: Math.round(lifetimeDebitedTotal * 100) / 100,
    lifetimeExpiredTotal: Math.round(lifetimeExpiredTotal * 100) / 100,
    lifetimeRevertedTotal: Math.round(lifetimeRevertedTotal * 100) / 100,
    expiringWithinDays,
    expiringWithinNDaysTotal: Math.round(expiringWithinNDaysTotal * 100) / 100,
    byCreditReasonCount,
    byCreditReasonAmount,
    staffVsCustomerTotals: {
      staff: Math.round(staffVsCustomerTotals.staff * 100) / 100,
      customer: Math.round(staffVsCustomerTotals.customer * 100) / 100,
    },
    anomaliesCount: anomalies.length,
    anomalies,
  };
};

const sheetTimestamp = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${ d.getFullYear() }${ pad(d.getMonth() + 1) }${ pad(d.getDate()) }-${ pad(d.getHours()) }${ pad(d.getMinutes()) }`;
};

const summaryToSheetRows = (summary) => {
  const {
    byCreditReasonCount,
    byCreditReasonAmount,
    byCurrencyOutstanding,
    staffVsCustomerTotals,
    anomalies,
    ...scalarSummary
  } = summary;

  const headerRows = Object.entries(scalarSummary).map(([metric, value]) => ({
    metric,
    value: typeof value === 'object' ? JSON.stringify(value) : value,
  }));

  const currencyRows = Object.entries(byCurrencyOutstanding).map(([currency, value]) => ({
    metric: `outstanding_${ currency }`,
    value,
  }));

  const reasonRows = Object.entries(byCreditReasonCount).map(([reason, count]) => ({
    metric: `credit_reason_${ reason }`,
    value: `${ count } txns / ${ byCreditReasonAmount[reason] || 0 }`,
  }));

  const staffRows = [
    { metric: 'outstanding_staff', value: staffVsCustomerTotals.staff },
    { metric: 'outstanding_customer', value: staffVsCustomerTotals.customer },
  ];

  return [
    ...headerRows,
    ...currencyRows,
    ...reasonRows,
    ...staffRows,
  ];
};

const shopifyStoreCreditsReportForRegion = async (
  credsPath,
  {
    apiVersion,
    excludeStaff,
    expiringWithinDays,
    pushToSheet,
    spreadsheetHandle,
    sheetsCredsPath,
    txFetchConcurrency,
  } = {},
) => {

  // 1. Bulk-fetch every customer + their store credit accounts (2 nested connections = within bulk depth).
  const bulkResponse = await shopifyBulkOperationDo(
    credsPath,
    'query',
    bulkAccountsQuery,
    { apiVersion },
  );

  if (!bulkResponse.success) {
    return bulkResponse;
  }

  const customers = bulkResponse.result || [];

  // 2. Build a flat list of (customer, account) pairs, optionally dropping staff.
  const customerAccountPairs = [];
  for (const customer of customers) {
    const {
      tags = [],
      StoreCreditAccounts = [],
    } = customer || {};

    const isStaff = (tags || []).includes(STAFF_TAG);
    if (excludeStaff && isStaff) {
      continue;
    }

    for (const account of StoreCreditAccounts) {
      customerAccountPairs.push({ customer, account });
    }
  }

  // 3. Bulk depth is capped at 2 connections, so fetch transactions per-account here.
  const ledger = [];
  const fetchErrors = [];

  const chunks = arrayToChunks(customerAccountPairs, txFetchConcurrency);

  for (const chunk of chunks) {
    const chunkResponses = await Promise.all(chunk.map(async ({ customer, account }) => {
      const accountId = gidToId(account.id);

      const txResponse = await shopifyStoreCreditGetSingle(
        credsPath,
        accountId,
        {
          apiVersion,
          attrs: transactionsAttrs,
        },
      );

      if (!txResponse.success) {
        return { customer, account, error: txResponse.error || txResponse };
      }

      const transactions = (txResponse.result?.transactions || []).map(t => t);

      return { customer, account, transactions };
    }));

    for (const { customer, account, transactions, error } of chunkResponses) {
      if (error) {
        fetchErrors.push({ accountId: gidToId(account.id), error });
        continue;
      }
      ledger.push(...flattenAccountToRows({
        region: credsPath,
        customer,
        account,
        transactions,
      }));
    }
  }

  // 4. Aggregate.
  const summary = buildSummary(ledger, { expiringWithinDays });

  const regionResult = {
    region: credsPath,
    ledger,
    summary,
    fetchErrors,
  };

  // 5. Optionally push to Google Sheets.
  if (pushToSheet) {
    const stamp = sheetTimestamp();

    const ledgerSheetResponse = await googlesheetsSpreadsheetSheetAdd(
      { spreadsheetHandle },
      { objArray: ledger },
      {
        sheetName: `${ credsPath }-ledger-${ stamp }`,
        credsPath: sheetsCredsPath,
      },
    );

    const summarySheetResponse = await googlesheetsSpreadsheetSheetAdd(
      { spreadsheetHandle },
      { objArray: summaryToSheetRows(summary) },
      {
        sheetName: `${ credsPath }-summary-${ stamp }`,
        credsPath: sheetsCredsPath,
      },
    );

    regionResult.sheets = {
      ledger: ledgerSheetResponse?.result,
      summary: summarySheetResponse?.result,
    };
  }

  return {
    success: true,
    result: regionResult,
  };
};

const shopifyStoreCreditsReport = async (
  {
    credsPaths = REGIONS_WF,
    apiVersion,
    excludeStaff = false,
    expiringWithinDays = 30,
    pushToSheet = true,
    spreadsheetHandle = 'store_credit',
    sheetsCredsPath,
    txFetchConcurrency = 10,
  } = {},
) => {

  const byRegion = {};

  for (const credsPath of credsPaths) {
    console.log(`shopifyStoreCreditsReport: ${ credsPath }`);

    const regionResponse = await shopifyStoreCreditsReportForRegion(
      credsPath,
      {
        apiVersion,
        excludeStaff,
        expiringWithinDays,
        pushToSheet,
        spreadsheetHandle,
        sheetsCredsPath,
        txFetchConcurrency,
      },
    );

    if (!regionResponse.success) {
      console.error(regionResponse);
      byRegion[credsPath] = { success: false, error: regionResponse.error };
      continue;
    }

    byRegion[credsPath] = regionResponse.result;
  }

  // Roll-up across regions for a top-level summary.
  const allLedger = Object.values(byRegion).flatMap(r => r?.ledger || []);
  const summary = buildSummary(allLedger, { expiringWithinDays });

  const response = {
    success: true,
    result: {
      byRegion,
      summary,
    },
  };

  logDeep(response);
  return response;
};

const shopifyStoreCreditsReportApi = funcApi(shopifyStoreCreditsReport, {
  argNames: ['options'],
});

module.exports = {
  shopifyStoreCreditsReport,
  shopifyStoreCreditsReportApi,
};

// curl localhost:8000/shopifyStoreCreditsReport -H "Content-Type: application/json" -d '{ "options": { "credsPaths": ["au"], "excludeStaff": false, "pushToSheet": true } }'
// curl localhost:8000/shopifyStoreCreditsReport -H "Content-Type: application/json" -d '{ "options": { "excludeStaff": true, "expiringWithinDays": 14 } }'
