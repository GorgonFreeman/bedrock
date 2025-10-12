const {
  funcApi,
  logDeep,
  arrayStandardResponse,
  surveyNestedArrays,
  dateFromNowCalendar,
  dateFromNow,
  days,
  gidToId,
  askQuestion,
} = require("../utils");

const { shopifyGiftCardsGet } = require("../shopify/shopifyGiftCardsGet");
const { shopifyOrderGet } = require("../shopify/shopifyOrderGet");
const { shopifyGiftCardDeactivate } = require("../shopify/shopifyGiftCardDeactivate");
const { shopifyStoreCreditAccountCredit } = require("../shopify/shopifyStoreCreditAccountCredit");
const { shopifyStoreCreditLifetimeGet } = require("../shopify/shopifyStoreCreditLifetimeGet");
const { swapReturnsGet } = require("../swap/swapReturnsGet");
const { bedrock_unlisted_slackErrorPost } = require("../bedrock_unlisted/bedrock_unlisted_slackErrorPost");

const SUB_KEY = "store_credit";

const defaultAttrs = `
  id
  note
  order {
    id
    name
  }
  balance {
    amount
    currencyCode
  }
  customer {
    id
    email
  }
  templateSuffix
  expiresOn
  enabled
`;

const getSwapOrders = async (region) => {
  const SWAP_ORDERS = [];
  const originalFromDate = dateFromNow({ minus: days(1), dateOnly: true });

  const fetchSwapReturnsRecursively = async (fromDatePayload) => {
    const swapReturns = await swapReturnsGet(region, fromDatePayload, {
      limit: 50,
    });

    if (!swapReturns || !swapReturns.success || !swapReturns.result) {
      return {
        success: false,
        results: ["Could not get returns"],
      };
    }

    const swapResults = swapReturns.result;

    SWAP_ORDERS.push(...swapResults?.orders);

    if (swapResults.next_from_date && swapResults.remaining > 0) {
      const nextDateOptions = {
        fromDate: swapResults.next_from_date,
      };
      return fetchSwapReturnsRecursively(nextDateOptions);
    }

    return {
      success: true,
      result: SWAP_ORDERS,
    };
  };

  const initialDateOptions = {
    fromDate: originalFromDate,
  };

  return await fetchSwapReturnsRecursively(initialDateOptions);
};

const extractOrderNameFromNote = (note) => {
  if (!note) return null;

  const swapPrefixedNote = note.split(":")[0];
  if (!swapPrefixedNote || !swapPrefixedNote.includes("SGC-")) return null;

  let orderName = swapPrefixedNote.replace("SGC-", "");

  if (orderName.endsWith("-1") || orderName.endsWith("-2")) {
    orderName = orderName.slice(0, -2);
  }

  if (orderName.includes("SW-")) {
    orderName = orderName.replace("SW-", "");
  }

  return orderName;
};

const getEligibleGiftCards = async (region, { fromDate, subKey }) => {
  const result = await shopifyGiftCardsGet(region, {
    attrs: defaultAttrs,
    queries: ["status:enabled", `created_at:>=${fromDate}`],
  });

  if (!result.success) {
    return {
      success: false,
      error: "Failed to get gift cards",
    };
  }

  const giftCards = result.result || [];
  const onlyEnabledGiftCards = giftCards.filter((giftCard) => giftCard.enabled);
  const storeCreditGiftCards = onlyEnabledGiftCards.filter((giftCard) => giftCard.templateSuffix === "store_credit");
  const giftCardsFromSwap = storeCreditGiftCards.filter((giftCard) => {
    return giftCard.note && giftCard.note.includes("SGC-");
  });

  return {
    success: true,
    result: giftCardsFromSwap,
  };
};

const matchGiftCardsToOrders = (giftCards, swapOrders) => {
  const swapOrdersMap = new Map();
  swapOrders.forEach((order) => {
    if (order.order_name) {
      swapOrdersMap.set(order.order_name, order);
    }
  });

  const matchingOrders = [];

  for (const giftCard of giftCards) {
    const orderName = extractOrderNameFromNote(giftCard.note);
    if (!orderName) continue;

    const findOrder = swapOrdersMap.get(orderName);
    if (!findOrder) continue;

    matchingOrders.push({
      ...findOrder,
      associatedGiftCard: giftCard,
    });
  }

  return matchingOrders;
};

const groupResultsByCustomer = (validResults) => {
  return validResults.reduce((groups, item) => {
    const customerId = gidToId(item.customerGid);
    if (!groups[customerId]) {
      groups[customerId] = {
        totalAmount: 0,
        currencyCode: item.currencyCode,
        giftCardIds: [],
        orderIds: [],
      };
    }
    groups[customerId].totalAmount += item.amountToCredit;
    groups[customerId].giftCardIds.push(item.giftCardId);
    groups[customerId].orderIds.push(item.orderId);
    return groups;
  }, {});
};

const processCreditResults = async (region, customerGroups, lifetimeMonths) => {
  const creditResults = [];

  for (const [customerId, groupData] of Object.entries(customerGroups)) {
    try {
      const creditResult = await shopifyStoreCreditAccountCredit(region, { customerId }, groupData.totalAmount, groupData.currencyCode, {
        expiresAt: dateFromNowCalendar({ months: lifetimeMonths, days: 1 }),
      });

      if (!creditResult.success) {
        return {
          success: false,
          error: `Error crediting ${customerId} with ${groupData.totalAmount} ${groupData.currencyCode}`,
        };
      }

      creditResults.push({
        customerGid: customerId,
        totalAmount: groupData.totalAmount,
        currencyCode: groupData.currencyCode,
        giftCardIds: groupData.giftCardIds,
        orderIds: groupData.orderIds,
        creditResult,
      });
    } catch (error) {
      return {
        success: false,
        error: `Error crediting ${customerId}: ${error.message}`,
      };
    }
  }

  return {
    success: true,
    result: creditResults,
  };
};

const processOrder = async (region, order, options) => {
  try {
    const {
      order_id,
      order_name,
      products,
      total_credit_exchange_value,
      associatedGiftCard,
    } = order;

    const orderData = await shopifyOrderGet(
      region,
      { orderId: order_id },
      {
        attrs: `
        id
        presentmentCurrencyCode 
        subtotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
          presentmentMoney {
            amount
            currencyCode
          }
        }
        totalDiscountsSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        totalShippingPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        totalTaxSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        customer {
          id
        }
        lineItems(first: 50) {
          edges {
            node {
              title
              sku
              id
              quantity
              variantTitle
              originalUnitPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              originalTotalSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              discountedUnitPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              discountedTotalSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      `,
        subKey: options.subKey,
      },
    );

    if (!orderData.success) {
      return {
        success: false,
        error: "Failed to get order data",
        result: { orderId: order_id },
      };
    }

    const {
      presentmentCurrencyCode,
      customer,
      subtotalPriceSet,
    } = orderData.result;

    const customerGid = customer.id;
    const strippedGiftCardId = gidToId(associatedGiftCard.id);

    let amountToCredit;
    let currencyCode;
    let deactivateResult;

    if (presentmentCurrencyCode === "GBP") {
      amountToCredit = parseFloat(total_credit_exchange_value);
      currencyCode = presentmentCurrencyCode;
    } else {
      const lineItems = orderData.result.lineItems;
      const returnedItemsMap = {};

      if (products) {
        products.forEach((item) => {
          const { sku, item_count = 1 } = item;
          returnedItemsMap[sku] = (returnedItemsMap[sku] || 0) + item_count;
        });
      }

      const matchingProducts = [];
      lineItems.forEach((product) => {
        const { sku } = product;
        if (sku && returnedItemsMap[sku] && returnedItemsMap[sku] > 0) {
          matchingProducts.push(product);
          returnedItemsMap[sku]--;
        }
      });

      const totalReturnAmount = matchingProducts.reduce((acc, product) => {
        const priceToUse = product.discountedTotalSet?.shopMoney?.amount
          ? parseFloat(product.discountedTotalSet.shopMoney.amount)
          : product.originalTotalSet?.shopMoney?.amount
            ? parseFloat(product.originalTotalSet.shopMoney.amount)
            : 0;
        return acc + priceToUse;
      }, 0);

      const orderSubtotal = parseFloat(subtotalPriceSet.shopMoney.amount);
      const orderSubtotalInPresentmentCurrency = parseFloat(subtotalPriceSet.presentmentMoney.amount);

      const finalReturnAmount = parseFloat(total_credit_exchange_value) || totalReturnAmount;
      const exchangeRate = parseFloat(orderSubtotalInPresentmentCurrency / orderSubtotal).toFixed(6);

      amountToCredit = finalReturnAmount * exchangeRate;
      currencyCode = subtotalPriceSet.presentmentMoney.currencyCode;
    }

    if (!options.demo) {
      deactivateResult = await shopifyGiftCardDeactivate(region, strippedGiftCardId, {
        options: { returnAttrs: "enabled deactivatedAt" },
      });

      const deactivationValid = deactivateResult.success === true && deactivateResult.result?.giftCard?.enabled === false;

      if (!deactivationValid) {
        return {
          success: false,
          error: `Error disabling gift card ${strippedGiftCardId} for customer ${customerGid} store credit not given`,
          result: {
            deactivationFailed: true,
            giftCardId: strippedGiftCardId,
            customerGid: gidToId(customerGid),
          },
        };
      }
    }

    return {
      success: true,
      result: {
        orderId: order_id,
        orderName: order_name,
        amountToCredit,
        currencyCode,
        customerGid,
        giftCardId: strippedGiftCardId,
        deactivateResult: options.demo
          ? { success: true, demo: true }
          : deactivateResult,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      result: { orderId: order.order_id },
    };
  }
};

const processRegion = async (region, options) => {
  try {
    const swapOrdersResult = await getSwapOrders(region);

    //logDeep(swapOrdersResult);
    //await askQuestion("?");

    if (!swapOrdersResult.success) {
      return {
        success: false,
        error: "Failed to get swap orders",
        result: { region },
      };
    }

    const swapOrders = swapOrdersResult.result;
    if (swapOrders.length === 0) {
      return {
        success: true,
        result: {
          region,
          results: ["No swap orders found"],
          processedOrders: [],
          creditResults: [],
        },
      };
    }

    const giftCardsResponse = await getEligibleGiftCards(region, options);
    if (!giftCardsResponse.success) {
      return {
        success: false,
        error: "Failed to get eligible gift cards",
        result: { region },
      };
    }

    //logDeep(giftCardsResponse);
    //await askQuestion("?");

    const giftCards = giftCardsResponse.result;
    if (giftCards.length === 0) {
      return {
        success: true,
        result: {
          region,
          results: ["No eligible gift cards found"],
          processedOrders: [],
          creditResults: [],
        },
      };
    }

    let matchingOrders = matchGiftCardsToOrders(giftCards, swapOrders);
    if (matchingOrders.length === 0) {
      return {
        success: true,
        result: {
          region,
          results: ["No matching orders found"],
          processedOrders: [],
          creditResults: [],
        },
      };
    }

    //logDeep(matchingOrders);
    //await askQuestion("?");

    const orderResponses = await Promise.all(matchingOrders.map((order) => processOrder(region, order, options)));

    const deactivationFailures = orderResponses.filter((r) => r.result?.deactivationFailed);
    if (deactivationFailures.length > 0) {
      const errorMessage = deactivationFailures
        .map((f) => f.error)
        .join("\n");
      return {
        success: false,
        error: errorMessage,
        result: {
          region,
          deactivationFailures: deactivationFailures.length,
          failedDeactivations: deactivationFailures,
        },
      };
    }

    const validResults = orderResponses.filter((r) => r.success && r.result?.customerGid);

    if (validResults.length === 0) {
      return {
        success: true,
        result: {
          region,
          results: ["No valid orders to process"],
          processedOrders: orderResponses,
          creditResults: [],
        },
      };
    }

    const customerGroups = groupResultsByCustomer(validResults.map((r) => r.result));

    const lifetimeResult = await shopifyStoreCreditLifetimeGet(region, { subKey: options.subKey });
    if (!lifetimeResult || !lifetimeResult.success) {
      return {
        success: false,
        error: `Error getting store credit lifetime for ${region}`,
        result: { region },
      };
    }
    const lifetimeMonths = lifetimeResult.result;

    let creditResults;
    if (!options.demo) {
      const creditResultsResponse = await processCreditResults(region, customerGroups, lifetimeMonths);
      if (!creditResultsResponse.success) {
        return creditResultsResponse;
      }
      creditResults = creditResultsResponse.result;
    } else {
      creditResults = Object.entries(customerGroups).map(([customerId, groupData]) => ({
        customerGid: customerId,
        totalAmount: groupData.totalAmount,
        currencyCode: groupData.currencyCode,
        giftCardIds: groupData.giftCardIds,
        orderIds: groupData.orderIds,
        creditResult: { success: true, demo: true },
      }));
    }

    return {
      success: true,
      result: {
        region,
        processedOrders: orderResponses,
        customerGroups: Object.keys(customerGroups).length,
        creditResults,
        failedOrders: 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      result: { region },
    };
  }
};

const collabsGiftCardToStoreCreditUk = async ({
  demo = false,
  subKey = SUB_KEY,
  daysBack = 1,
} = {}) => {
  const fromDate = dateFromNow({ minus: days(daysBack), dateOnly: true });
  const region = "uk";

  const regionResponse = await processRegion(region, {
    demo,
    subKey,
    fromDate,
  });

  const regionResults = arrayStandardResponse([regionResponse]);

  const resultsSummary = surveyNestedArrays([regionResponse], {
    successPath: "success",
    countPaths: [
      "result.result.creditResults.length",
      "result.result.processedOrders.length",
      "result.result.failedOrders",
    ],
  });

  logDeep({ regionResults, resultsSummary });

  return { ...regionResults };
};

const collabsGiftCardToStoreCreditUkApi = funcApi(collabsGiftCardToStoreCreditUk, {
  argNames: ["options"],
  errorReporter: bedrock_unlisted_slackErrorPost,
  errorReporterPayload: {
    options: {
      logFlavourText: "collabsGiftCardToStoreCreditUk",
      errorChannelNameHosted: "#alerts_swap_store_credit",
      errorChannelNameLocal: "#alerts_swap_store_credit",
    },
  },
  requireHostedApiKey: true,
  allowCrossOrigin: true,
});

module.exports = {
  collabsGiftCardToStoreCreditUk,
  collabsGiftCardToStoreCreditUkApi,
};

// curl localhost:8000/collabsGiftCardToStoreCreditUk
// curl localhost:8000/collabsGiftCardToStoreCreditUk -H "Content-Type: application/json" -d '{ "options": { "demo": true } }'
