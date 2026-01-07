// https://shopify.dev/docs/api/admin-graphql/latest/queries/customer
// https://shopify.dev/docs/api/admin-graphql/latest/mutations/storeCreditAccountCredit

const {
  funcApi,
  logDeep,
  arrayStandardResponse,
  dateFromNowCalendar,
  askQuestion,
} = require("../utils");
const { shopifyCustomerGet } = require("../shopify/shopifyCustomerGet");
const {
  shopifyStoreCreditAccountCredit,
} = require("../shopify/shopifyStoreCreditAccountCredit");
const {
  shopifyStoreCreditLifetimeGet,
} = require("../shopify/shopifyStoreCreditLifetimeGet");

const storeCreditAttrs = `
  storeCreditAccounts(first: 10) {
    edges {
      node {
        id
        balance {
          amount
          currencyCode
        }
        transactions(first: 250) {
          edges {
            node {
              amount {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
`;

const getStoreCreditTransactions = async (
  credsPath,
  customerId,
  { apiVersion } = {},
) => {
  const customerResponse = await shopifyCustomerGet(
    credsPath,
    { customerId },
    {
      apiVersion,
      attrs: `id ${storeCreditAttrs}`,
    },
  );

  if (!customerResponse?.success || !customerResponse?.result) {
    return {
      success: false,
      error: customerResponse?.error || ["Failed to get customer"],
      result: null,
    };
  }

  const customer = customerResponse.result;
  const { storeCreditAccounts } = customer;

  if (!storeCreditAccounts) {
    return {
      success: true,
      result: {
        transactions: [],
        currencyCode: null,
      },
    };
  }

  // Handle different structures after stripEdgesAndNodes processing
  // Could be: array, object with items, or object with direct account values
  let accounts = [];
  if (Array.isArray(storeCreditAccounts)) {
    accounts = storeCreditAccounts;
  } else if (
    storeCreditAccounts.items &&
    Array.isArray(storeCreditAccounts.items)
  ) {
    accounts = storeCreditAccounts.items;
  } else if (typeof storeCreditAccounts === "object") {
    accounts = Object.values(storeCreditAccounts);
  }

  if (accounts.length === 0) {
    return {
      success: true,
      result: {
        transactions: [],
        currencyCode: null,
      },
    };
  }

  // Get transactions from all accounts
  const allTransactions = [];
  let currencyCode = null;

  for (const account of accounts) {
    const { balance, transactions } = account || {};

    if (balance?.currencyCode && !currencyCode) {
      currencyCode = balance.currencyCode;
    }

    // Handle transactions structure (could be array or have items)
    let transactionList = [];
    if (Array.isArray(transactions)) {
      transactionList = transactions;
    } else if (transactions?.items && Array.isArray(transactions.items)) {
      transactionList = transactions.items;
    } else if (transactions?.edges && Array.isArray(transactions.edges)) {
      transactionList = transactions.edges.map((edge) => edge.node);
    }

    for (const transaction of transactionList) {
      if (transaction?.amount) {
        allTransactions.push(transaction.amount);
      }
    }
  }

  return {
    success: true,
    result: {
      transactions: allTransactions,
      currencyCode,
    },
  };
};

const shopifyProcessRefunds = async (
  credsPath,
  {
    subKey = "store_credit",
    apiVersion,
    customerData = {},
    demo = false,
    interactive = true,
  } = {},
) => {
  // Validate customer data
  if (!customerData || Object.keys(customerData).length === 0) {
    return {
      success: false,
      error: [
        "No customer data provided. Please provide customerData object with customerId as key and amount as value.",
      ],
    };
  }

  console.log("\n=== Starting Store Credit Processing ===");
  logDeep({
    totalCustomers: Object.keys(customerData).length,
    demo,
    credsPath,
    subKey,
  });

  // 1. Get store credit lifetime
  console.log("\n[Step 1] Getting store credit lifetime...");
  const lifetimeResponse = await shopifyStoreCreditLifetimeGet(credsPath, {
    subKey,
  });

  if (!lifetimeResponse.success) {
    return {
      success: false,
      error: lifetimeResponse.error || ["Failed to get store credit lifetime"],
    };
  }

  const lifetimeMonths = lifetimeResponse.result;
  logDeep({
    step: "Store Credit Lifetime",
    lifetimeMonths,
    result: lifetimeResponse.result,
  });

  if (interactive) {
    const proceed = await askQuestion(
      `\nStore credit lifetime: ${lifetimeMonths} months. Continue? (yes/no): `,
    );
    if (proceed.toLowerCase() !== "yes" && proceed.toLowerCase() !== "y") {
      return {
        success: false,
        error: ["User cancelled after lifetime retrieval"],
      };
    }
  }

  // 2. Get shop currency code as fallback for customers without store credit accounts
  console.log("\n[Step 2] Getting shop currency code...");
  const { shopifyGetSingle } = require("../shopify/shopifyGetSingle");
  const shopResponse = await shopifyGetSingle(credsPath, "shop", "shop", {
    apiVersion,
    attrs: "currencyCode",
  });
  const defaultCurrencyCode = shopResponse?.success
    ? shopResponse.result?.currencyCode
    : null;

  logDeep({
    step: "Shop Currency Code",
    defaultCurrencyCode,
    result: shopResponse.result,
  });

  if (interactive) {
    const proceed = await askQuestion(
      `\nShop default currency: ${defaultCurrencyCode || "NOT FOUND"}. Continue? (yes/no): `,
    );
    if (proceed.toLowerCase() !== "yes" && proceed.toLowerCase() !== "y") {
      return {
        success: false,
        error: ["User cancelled after currency retrieval"],
      };
    }
  }

  const results = [];
  const skipped = [];
  const customerIds = Object.keys(customerData);
  const totalCustomers = customerIds.length;

  // Show summary before processing
  console.log("\n[Step 3] Ready to process customers...");
  logDeep({
    step: "Processing Summary",
    totalCustomers,
    demo: demo
      ? "DEMO MODE - No credits will be applied"
      : "REAL MODE - Credits will be applied",
    lifetimeMonths,
    defaultCurrencyCode,
    customerDataPreview: Object.fromEntries(
      Object.entries(customerData).slice(0, 5),
    ),
  });

  if (interactive) {
    const proceed = await askQuestion(
      `\nReady to process ${totalCustomers} customers in ${demo ? "DEMO" : "REAL"} mode. Continue? (yes/no): `,
    );
    if (proceed.toLowerCase() !== "yes" && proceed.toLowerCase() !== "y") {
      return {
        success: false,
        error: ["User cancelled before processing customers"],
      };
    }
  }

  // 3. Process each customer
  console.log(`\n[Step 4] Processing ${totalCustomers} customers...`);
  let processedCount = 0;

  for (const [customerId, initialValue] of Object.entries(customerData)) {
    processedCount++;
    if (processedCount % 10 === 0) {
      console.log(
        `  Processed ${processedCount}/${totalCustomers} customers...`,
      );
    }
    try {
      // Get store credit transactions
      const transactionsResponse = await getStoreCreditTransactions(
        credsPath,
        customerId,
        { apiVersion },
      );

      if (!transactionsResponse.success) {
        results.push({
          success: false,
          customerId,
          initialValue,
          error: transactionsResponse.error || ["Failed to get transactions"],
          allTransactions: [],
        });
        continue;
      }

      const { transactions, currencyCode } = transactionsResponse.result;

      // Check if initialValue exists in transaction history
      const matchingTransactions = transactions.filter((transaction) => {
        const transactionAmount = parseFloat(transaction.amount);
        const expectedAmount = parseFloat(initialValue);
        return Math.abs(transactionAmount - expectedAmount) < 0.01; // Allow for floating point precision
      });

      if (matchingTransactions.length > 0) {
        skipped.push({
          customerId,
          initialValue,
          currencyCode: currencyCode || "N/A",
          reason: "Transaction with matching amount already exists",
          matchingTransactions: matchingTransactions.map((t) => ({
            amount: t.amount,
            currencyCode: t.currencyCode,
          })),
          allTransactions: transactions.map((t) => ({
            amount: t.amount,
            currencyCode: t.currencyCode,
          })),
        });
        continue;
      }

      // Credit the customer
      // Use currency from account, or fallback to shop's default currency
      const currencyToUse = currencyCode || defaultCurrencyCode;

      if (!currencyToUse) {
        results.push({
          success: false,
          customerId,
          initialValue,
          error: [
            "No currency code found for customer and shop currency could not be determined",
          ],
          allTransactions: transactions.map((t) => ({
            amount: t.amount,
            currencyCode: t.currencyCode,
          })),
        });
        continue;
      }

      const expiresAt = dateFromNowCalendar({
        months: lifetimeMonths,
        days: 1,
      });

      if (demo) {
        // Demo mode: don't actually credit, just show what would happen
        results.push({
          success: true,
          customerId,
          initialValue,
          currencyCode: currencyToUse,
          currencySource: currencyCode ? "from_account" : "from_shop_default",
          expiresAt,
          demo: true,
          wouldCredit: {
            amount: initialValue,
            currencyCode: currencyToUse,
            expiresAt,
          },
          allTransactions: transactions.map((t) => ({
            amount: t.amount,
            currencyCode: t.currencyCode,
          })),
        });
      } else {
        // Real mode: actually credit the customer
        const creditResponse = await shopifyStoreCreditAccountCredit(
          credsPath,
          { customerId },
          initialValue,
          currencyToUse,
          {
            apiVersion,
            expiresAt,
          },
        );

        if (!creditResponse.success) {
          results.push({
            success: false,
            customerId,
            initialValue,
            currencyCode: currencyToUse,
            currencySource: currencyCode ? "from_account" : "from_shop_default",
            error: creditResponse.error || ["Failed to credit account"],
            allTransactions: transactions.map((t) => ({
              amount: t.amount,
              currencyCode: t.currencyCode,
            })),
          });
        } else {
          results.push({
            success: true,
            customerId,
            initialValue,
            currencyCode: currencyToUse,
            currencySource: currencyCode ? "from_account" : "from_shop_default",
            expiresAt,
            result: creditResponse.result,
            allTransactions: transactions.map((t) => ({
              amount: t.amount,
              currencyCode: t.currencyCode,
            })),
          });
        }
      }
    } catch (error) {
      results.push({
        success: false,
        customerId,
        initialValue,
        error: [error.message],
        allTransactions: [],
      });
    }
  }

  const arrayResponse = arrayStandardResponse(results);

  // In demo mode, consider it successful if we got the information we needed
  // (even if some customers failed, we still successfully ran the demo)
  const overallSuccess = demo ? true : arrayResponse.success;

  const finalSummary = {
    ...arrayResponse.result,
    skipped,
    totalProcessed: Object.keys(customerData).length,
    totalCredited: results.filter((r) => r.success).length,
    totalSkipped: skipped.length,
    totalFailed: results.filter((r) => !r.success).length,
    defaultCurrencyCode: defaultCurrencyCode,
    ...(demo && {
      note: "DEMO MODE: No credits were actually applied. This shows what would happen if run in real mode.",
    }),
  };

  console.log("\n[Step 5] Processing complete!");
  logDeep({
    step: "Final Summary",
    ...finalSummary,
  });

  if (interactive) {
    console.log("\n=== Processing Results ===");
    console.log(`Total Processed: ${finalSummary.totalProcessed}`);
    console.log(`Total Credited: ${finalSummary.totalCredited}`);
    console.log(`Total Skipped: ${finalSummary.totalSkipped}`);
    console.log(`Total Failed: ${finalSummary.totalFailed}`);
    console.log(`Demo Mode: ${demo ? "YES" : "NO"}`);
  }

  return {
    success: overallSuccess,
    demo: demo,
    result: finalSummary,
    ...(!demo && arrayResponse.error && { error: arrayResponse.error }),
  };
};

const shopifyProcessRefundsApi = funcApi(shopifyProcessRefunds, {
  argNames: ["credsPath", "options"],
});

module.exports = {
  shopifyProcessRefunds,
  shopifyProcessRefundsApi,
};

// curl localhost:8000/shopifyProcessRefunds -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "subKey": "store_credit", "customerData": { "22228268384629": 60.0, "22323895763317": 27.0 }, "demo": true, "interactive": true } }'
