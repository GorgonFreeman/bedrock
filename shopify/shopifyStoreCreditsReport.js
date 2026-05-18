// https://shopify.dev/docs/api/admin-graphql/latest/queries/storeCreditAccount

const { REGIONS_WF, HOSTED } = require('../constants');
const { funcApi, logDeep, gidToId, days, yearsish, dateTimeFromNow, Processor } = require('../utils');

const { shopifyCustomersGetter } = require('../shopify/shopifyCustomersGet');
const { shopifyStoreCreditGetSingle } = require('../shopify/shopifyStoreCreditGet');
const { shopifyTagsAdd } = require('../shopify/shopifyTagsAdd');
const { googlesheetsSpreadsheetSheetAdd } = require('../googlesheets/googlesheetsSpreadsheetSheetAdd');
const { googlesheetsSpreadsheetSheetAppend } = require('../googlesheets/googlesheetsSpreadsheetSheetAppend');
const { spreadsheetHandleToSpreadsheetId } = require('../bedrock_unlisted/mappings');

const STAFF_TAG = 'group:staff';
const EXCLUDED_EMAIL_DOMAIN = 'whitefoxboutique.com';
// Customers carrying this tag are skipped on the next run via Shopify's `tag_not:` query,
// so an interrupted run is resumed transparently with no in-band state to track.
const AUDIT_TAG = 'store_credit_audited';

// Short readable labels for the GraphQL transaction typenames.
const TX_TYPE = {
  StoreCreditAccountCreditTransaction:      'credit',
  StoreCreditAccountDebitTransaction:       'debit',
  StoreCreditAccountExpirationTransaction:  'expiry',
  StoreCreditAccountDebitRevertTransaction: 'debit_revert',
};

// Internal camelCase keys — used by buildSummary and row objects.
const LEDGER_HEADERS = [
  'region',
  'customerId',
  'email',
  'firstName',
  'lastName',
  'accountId',
  'balance',
  'currency',
  'txType',
  'txId',
  'createdAt',
  'txAmount',
  'txCurrency',
  'balanceAfter',
  'event',
  'creditSource',
  'orderTransactionId',
  'expiresAt',
  'remainingAmount',
  'linkedTransactionId',
];

// Human-readable column labels written to the sheet — same order as LEDGER_HEADERS.
const LEDGER_DISPLAY_HEADERS = [
  'Region',
  'Customer ID',
  'Email',
  'First Name',
  'Last Name',
  'Account ID',
  'Balance',
  'Currency',
  'Transaction Type',
  'Transaction ID',
  'Created At',
  'Amount',
  'Amount Currency',
  'Balance After',
  'Event',
  'Credit Source',
  'Order Transaction ID',
  'Expires At',
  'Remaining Amount',
  'Linked Transaction ID',
];

const toSheetRow = (row) => {
  const out = {};
  LEDGER_HEADERS.forEach((key, i) => { out[LEDGER_DISPLAY_HEADERS[i]] = row[key]; });
  return out;
};

// Per-customer attrs for the streaming getter. Transactions are fetched separately
// because nested transaction connections blow out page size and trigger throttling.
const customerAttrs = `
  id
  email
  firstName
  lastName
  tags
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
  since,
}) => {
  const { id: customerGid, email, firstName, lastName } = customer || {};
  const { id: accountGid, balance } = account || {};

  const customerId = customerGid ? gidToId(customerGid) : null;
  const accountId  = accountGid  ? gidToId(accountGid)  : null;
  const balanceAmt = toNumber(balance?.amount);
  const currency   = balance?.currencyCode || null;

  const customerFields = {
    region,
    customerId,
    email:     email     || null,
    firstName: firstName || null,
    lastName:  lastName  || null,
    accountId,
    balance: balanceAmt,
    currency,
  };

  const visibleTx = since
    ? (transactions || []).filter(tx => tx?.createdAt && new Date(tx.createdAt) >= since)
    : (transactions || []);

  if (!visibleTx.length) {
    return [{
      ...customerFields,
      txType: null, txId: null, createdAt: null,
      txAmount: null, txCurrency: null, balanceAfter: null,
      event: null, creditSource: null, orderTransactionId: null,
      expiresAt: null, remainingAmount: null, linkedTransactionId: null,
    }];
  }

  return visibleTx.map(tx => {
    const {
      __typename,
      id: txGid,
      amount: txAmountObj,
      balanceAfterTransaction,
      createdAt,
      event,
      origin,
      expiresAt,
      remainingAmount,
      debitTransaction,
      creditTransaction,
    } = tx || {};

    const linkedGid           = debitTransaction?.id || creditTransaction?.id || null;
    const orderTransactionId  = origin?.__typename === 'OrderTransaction' && origin?.id ? gidToId(origin.id) : null;

    return {
      ...customerFields,
      txType:             TX_TYPE[__typename] || __typename || null,
      txId:               txGid ? gidToId(txGid) : null,
      createdAt:          createdAt || null,
      txAmount:           toNumber(txAmountObj?.amount),
      txCurrency:         txAmountObj?.currencyCode || null,
      balanceAfter:       toNumber(balanceAfterTransaction?.amount),
      event:              event || null,
      creditSource:       origin?.__typename || null,
      orderTransactionId,
      expiresAt:          expiresAt || null,
      remainingAmount:    remainingAmount?.amount !== undefined ? toNumber(remainingAmount.amount) : null,
      linkedTransactionId: linkedGid ? gidToId(linkedGid) : null,
    };
  });
};

const round2 = (n) => Math.round(n * 100) / 100;

const buildSummary = (ledger, { expiringWithinDays }) => {

  const expiringThreshold = new Date(dateTimeFromNow({ plus: days(expiringWithinDays) }));

  const accountsSeen        = new Map(); // accountId → { balance, currency }
  const txTotals            = new Map(); // accountId → { credited, debited, expired, reverted }
  const byCreditSourceCount  = {};
  const byCreditSourceAmount = {};
  const byCurrencyOutstanding = {};

  let credited = 0;
  let debited  = 0;
  let expired  = 0;
  let reverted = 0;
  let expiringSoon = 0;

  for (const row of ledger) {
    const { accountId, balance, currency, txType, txAmount, expiresAt, remainingAmount, creditSource } = row;

    if (accountId && !accountsSeen.has(accountId)) {
      accountsSeen.set(accountId, { balance, currency });
      if (balance > 0 && currency) {
        byCurrencyOutstanding[currency] = (byCurrencyOutstanding[currency] || 0) + balance;
      }
      txTotals.set(accountId, { credited: 0, debited: 0, expired: 0, reverted: 0 });
    }

    if (!txType) continue;

    const totals = txTotals.get(accountId);

    if (txType === 'credit') {
      credited          += txAmount;
      totals.credited   += txAmount;

      const src = creditSource || 'mutation';
      byCreditSourceCount[src]  = (byCreditSourceCount[src]  || 0) + 1;
      byCreditSourceAmount[src] = (byCreditSourceAmount[src] || 0) + txAmount;

      if (expiresAt && remainingAmount > 0 && new Date(expiresAt) <= expiringThreshold) {
        expiringSoon += remainingAmount;
      }
    } else if (txType === 'debit') {
      debited         += Math.abs(txAmount);
      totals.debited  += Math.abs(txAmount);
    } else if (txType === 'expiry') {
      expired         += Math.abs(txAmount);
      totals.expired  += Math.abs(txAmount);
    } else if (txType === 'debit_revert') {
      reverted        += txAmount;
      totals.reverted += txAmount;
    }
  }

  const anomalies = [];

  for (const [accountId, { balance, currency }] of accountsSeen) {
    const t = txTotals.get(accountId) || { credited: 0, debited: 0, expired: 0, reverted: 0 };
    const expected = t.credited - t.debited - t.expired + t.reverted;
    const drift    = round2(balance - expected);

    if (Math.abs(drift) >= 0.01) {
      anomalies.push({ type: 'balance_drift', accountId, currency, balance, expected: round2(expected), drift });
    }

    if (balance > 0 && t.credited <= 0) {
      anomalies.push({ type: 'balance_without_credits', accountId, currency, balance });
    }
  }

  const outstandingTotal = Object.values(byCurrencyOutstanding).reduce((sum, n) => sum + n, 0);

  return {
    accountsCount:     accountsSeen.size,
    ledgerRowsCount:   ledger.length,
    outstandingTotal:  round2(outstandingTotal),
    byCurrencyOutstanding,
    lifetimeCredited:  round2(credited),
    lifetimeDebited:   round2(debited),
    lifetimeExpired:   round2(expired),
    lifetimeReverted:  round2(reverted),
    expiringWithinDays,
    expiringSoonTotal: round2(expiringSoon),
    byCreditSourceCount,
    byCreditSourceAmount,
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
    byCreditSourceCount,
    byCreditSourceAmount,
    byCurrencyOutstanding,
    anomalies,
    ...scalarSummary
  } = summary;

  const scalarRows = Object.entries(scalarSummary).map(([metric, value]) => ({
    metric,
    value: typeof value === 'object' ? JSON.stringify(value) : value,
  }));

  const currencyRows = Object.entries(byCurrencyOutstanding).map(([currency, value]) => ({
    metric: `outstanding_${ currency }`,
    value,
  }));

  const sourceRows = Object.entries(byCreditSourceCount).map(([source, count]) => ({
    metric: `credit_source_${ source }`,
    value: `${ count } txns / ${ byCreditSourceAmount[source] || 0 }`,
  }));

  return [
    ...scalarRows,
    ...currencyRows,
    ...sourceRows,
  ];
};

const shopifyStoreCreditsReportForRegion = async (
  credsPath,
  {
    apiVersion,
    expiringWithinDays,
    since,
    pushToSheet,
    spreadsheetHandle,
    sheetsCredsPath,
    ledgerSheetName,
    queueInterval,
  } = {},
) => {

  // 1. Resolve spreadsheet ID and ledger sheet name up front.
  //    The sheet itself is created lazily on the first write so there's no empty/header-only sheet
  //    if the run finds nothing to report. If ledgerSheetName is supplied we treat it as an existing
  //    sheet and go straight to appending (resume into a specific tab).
  let resolvedLedgerSheetName = ledgerSheetName;
  let spreadsheetId;
  let ledgerSheetExists = !!ledgerSheetName; // if a name was passed, sheet already exists

  if (pushToSheet) {
    spreadsheetId = spreadsheetHandleToSpreadsheetId[spreadsheetHandle];

    if (!resolvedLedgerSheetName) {
      resolvedLedgerSheetName = `${ credsPath }-ledger-${ sheetTimestamp() }`;
    }
  }

  // 2. Shared piles — data flows: fetched → filtered | disqualified → rowsReady → appended → tagged
  const piles = {
    fetched: [],
    filtered: [],      // customers with ≥1 account that has a positive balance
    disqualified: [],  // staff or customers with no positive-balance accounts
    rowsReady: [],     // { customer, rows } after tx fetch
    appended: [],      // customers whose rows have been written to sheet (or skipped)
    tagged: [],
    fetchErrors: [],
    tagErrors: [],
  };

  const ledger = [];

  // 3. Getter — streams customers page by page, excluding those already audited.
  const customersGetter = await shopifyCustomersGetter(
    credsPath,
    {
      apiVersion,
      queries: [`tag_not:${ AUDIT_TAG }`],
      attrs: customerAttrs,
      onItems: (items) => piles.fetched.push(...items),
      logFlavourText: `${ credsPath } fetch:`,
    },
  );

  // 4. filterProcessor — decides whether a customer needs tx fetching.
  //    Disqualified customers go straight to appended so they still get tagged.
  const filterProcessor = new Processor(
    piles.fetched,
    async (pile) => {
      const customer = pile.shift();
      const { email, tags = [], storeCreditAccounts = [] } = customer || {};

      const isStaff = (tags || []).includes(STAFF_TAG);
      const isInternalEmail = (email || '').toLowerCase().endsWith(`@${ EXCLUDED_EMAIL_DOMAIN }`);

      if (isStaff || isInternalEmail) {
        piles.disqualified.push(customer);
        piles.appended.push(customer);
        return;
      }

      const accountsToFetch = storeCreditAccounts.filter(
        account => toNumber(account?.balance?.amount) > 0,
      );

      if (!accountsToFetch.length) {
        piles.disqualified.push(customer);
        piles.appended.push(customer);
        return;
      }

      piles.filtered.push({ customer, accountsToFetch });
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: `${ credsPath } filter:`,
    },
  );

  // 5. txFetchProcessor — fetches transactions for every qualifying account on this customer.
  const txFetchProcessor = new Processor(
    piles.filtered,
    async (pile) => {
      const { customer, accountsToFetch } = pile.shift();

      const accountResults = await Promise.all(
        accountsToFetch.map(async (account) => {
          const accountId = gidToId(account.id);
          const txResponse = await shopifyStoreCreditGetSingle(
            credsPath,
            accountId,
            { apiVersion, attrs: transactionsAttrs },
          );

          if (!txResponse.success) {
            piles.fetchErrors.push({ accountId, error: txResponse.error || txResponse });
            return null;
          }

          return {
            account,
            transactions: txResponse.result?.transactions || [],
          };
        }),
      );

      const allRows = accountResults
        .filter(Boolean)
        .flatMap(({ account, transactions }) =>
          flattenAccountToRows({ region: credsPath, customer, account, transactions, since }),
        );

      piles.rowsReady.push({ customer, rows: allRows });
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      maxInFlightRequests: 10,
      runOptions: { interval: queueInterval },
      logFlavourText: `${ credsPath } txFetch:`,
    },
  );

  // 6. sheetAppendProcessor — writes rows to the ledger sheet one customer at a time.
  //    First write creates the sheet (giving us the header row for free via SheetAdd).
  //    Subsequent writes append. maxInFlightRequests: 1 keeps sheet writes serial.
  const sheetAppendProcessor = new Processor(
    piles.rowsReady,
    async (pile) => {
      const { customer, rows } = pile.shift();

      ledger.push(...rows);

      if (pushToSheet && rows.length) {
        const displayRows = rows.map(toSheetRow);
        if (!ledgerSheetExists) {
          await googlesheetsSpreadsheetSheetAdd(
            { spreadsheetId },
            { objArray: displayRows },
            { sheetName: resolvedLedgerSheetName, credsPath: sheetsCredsPath, trim: false },
          );
          ledgerSheetExists = true;
        } else {
          await googlesheetsSpreadsheetSheetAppend(
            { spreadsheetId },
            { objArray: displayRows, headers: LEDGER_DISPLAY_HEADERS },
            { sheetName: resolvedLedgerSheetName, credsPath: sheetsCredsPath },
          );
        }
      }

      piles.appended.push(customer);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      maxInFlightRequests: 1,
      runOptions: { interval: 50 },
      logFlavourText: `${ credsPath } append:`,
    },
  );

  // 7. tagProcessor — stamps each processed customer with AUDIT_TAG so future runs skip them.
  const tagProcessor = new Processor(
    piles.appended,
    async (pile) => {
      const customer = pile.shift();
      const tagResponse = await shopifyTagsAdd(
        credsPath,
        customer.id,
        [AUDIT_TAG],
        { apiVersion },
      );

      if (!tagResponse.success) {
        piles.tagErrors.push({ customerId: gidToId(customer.id), error: tagResponse.error || tagResponse });
        return;
      }

      piles.tagged.push(customer);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      maxInFlightRequests: 10,
      runOptions: { interval: 50 },
      logFlavourText: `${ credsPath } tag:`,
    },
  );

  // 8. Wire canFinish signals down the chain.
  customersGetter.on('done', () => { filterProcessor.canFinish = true; });
  filterProcessor.on('done', () => {
    txFetchProcessor.canFinish = true;
    // sheetAppendProcessor also needs to know when no more rowsReady items are coming
    // from txFetch — that signal comes from txFetchProcessor below, but if there were
    // zero filtered items we need to allow it to finish immediately.
    if (piles.filtered.length === 0) sheetAppendProcessor.canFinish = true;
  });
  txFetchProcessor.on('done', () => { sheetAppendProcessor.canFinish = true; });
  sheetAppendProcessor.on('done', () => { tagProcessor.canFinish = true; });

  await Promise.all([
    customersGetter.run({ verbose: !HOSTED }),
    filterProcessor.run({ verbose: false }),
    txFetchProcessor.run({ verbose: !HOSTED }),
    sheetAppendProcessor.run({ verbose: !HOSTED }),
    tagProcessor.run({ verbose: !HOSTED }),
  ]);

  // 9. Build summary from accumulated ledger and write summary sheet.
  const summary = buildSummary(ledger, { expiringWithinDays });

  const regionResult = {
    region: credsPath,
    ledger,
    summary,
    piles: {
      tagged: piles.tagged,
      disqualified: piles.disqualified,
      fetchErrors: piles.fetchErrors,
      tagErrors: piles.tagErrors,
    },
    ...(resolvedLedgerSheetName ? { ledgerSheetName: resolvedLedgerSheetName } : {}),
  };

  if (pushToSheet) {
    const stamp = sheetTimestamp();

    const summarySheetResponse = await googlesheetsSpreadsheetSheetAdd(
      { spreadsheetId },
      { objArray: summaryToSheetRows(summary) },
      {
        sheetName: `${ credsPath }-summary-${ stamp }`,
        credsPath: sheetsCredsPath,
      },
    );

    regionResult.sheets = {
      ledger: {
        sheetName: resolvedLedgerSheetName,
        sheetUrl: `https://docs.google.com/spreadsheets/d/${ spreadsheetId }/edit`,
      },
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
    expiringWithinDays = 30,
    lookbackYears = 1,
    pushToSheet = true,
    spreadsheetHandle = 'store_credit',
    sheetsCredsPath,
    ledgerSheetName,
    queueInterval = 200,
  } = {},
) => {

  const since = lookbackYears ? new Date(Date.now() - yearsish(lookbackYears)) : null;

  // All regions run in parallel — each is a separate Shopify store with no shared state.
  const regionEntries = await Promise.all(
    credsPaths.map(async (credsPath) => {
      console.log(`shopifyStoreCreditsReport: ${ credsPath }`);

      const regionResponse = await shopifyStoreCreditsReportForRegion(
        credsPath,
        {
          apiVersion,
          expiringWithinDays,
          since,
          pushToSheet,
          spreadsheetHandle,
          sheetsCredsPath,
          ledgerSheetName,
          queueInterval,
        },
      );

      if (!regionResponse.success) {
        console.error(regionResponse);
        return [credsPath, { success: false, error: regionResponse.error }];
      }

      return [credsPath, regionResponse.result];
    }),
  );

  const byRegion = Object.fromEntries(regionEntries);

  // Roll-up summary across all regions using each region's already-built summary.
  const allLedger = Object.values(byRegion).flatMap(r => r?.ledger || []);
  const summary = buildSummary(allLedger, { expiringWithinDays });

  // Drop the per-region ledger arrays from the response — the sheet already holds that data
  // and returning it here would make the payload enormous for large runs.
  for (const regionResult of Object.values(byRegion)) {
    if (regionResult?.ledger) delete regionResult.ledger;
  }

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

// Full run — all WF regions, last 12 months, push to store_credit sheet:
// curl localhost:8000/shopifyStoreCreditsReport -H "Content-Type: application/json" -d '{ "options": { "pushToSheet": true } }'

// Single region, expiring within 14 days (staff are always excluded automatically):
// curl localhost:8000/shopifyStoreCreditsReport -H "Content-Type: application/json" -d '{ "options": { "credsPaths": ["au"], "expiringWithinDays": 14 } }'

// Resume an interrupted run — just re-run the same command. Customers already tagged
// store_credit_audited are excluded automatically via the Shopify tag_not: query filter.
// Optionally pass ledgerSheetName to append into the existing ledger tab rather than creating a new one:
// curl localhost:8000/shopifyStoreCreditsReport -H "Content-Type: application/json" -d '{ "options": { "credsPaths": ["au"], "ledgerSheetName": "au-ledger-20260518-1000" } }'
