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
const { shopifyGiftCardDeactivate } = require("../shopify/shopifyGiftCardDeactivate");
const { shopifyOrderGet } = require("../shopify/shopifyOrderGet");
const { shopifyStoreCreditAccountCredit } = require("../shopify/shopifyStoreCreditAccountCredit");
const { shopifyStoreCreditLifetimeGet } = require("../shopify/shopifyStoreCreditLifetimeGet");
const { loopReturnGet } = require("../loop/loopReturnGet");
const { bedrock_unlisted_slackErrorPost } = require("../bedrock_unlisted/bedrock_unlisted_slackErrorPost");

const SUB_KEY = "store_credit";

const defaultAttrs = `
  id
  balance {
    amount
    currencyCode
  }
  customer {
    id
    email
  }
  lastCharacters
  note
  templateSuffix
  expiresOn
  enabled
`;

const extractReturnIdFromNote = (note) => {
  if (!note) return null;

  const normalisedString = note.replaceAll("\n", " ");
  const splitNote = normalisedString.split(" ");

  return splitNote.find((_, index) => splitNote[index - 2] === "Return" && splitNote[index - 1] === "ID:");
};

const getLoopReturnData = async (region, returnId) => {
  const loopInfo = await loopReturnGet(region, {
    returnId,
  });

  if (!loopInfo || loopInfo.success !== true) {
    return null;
  }

  const returnData = loopInfo.result;
  const { return_credit_total: returnTotal, order_id } = returnData;

  if (!returnTotal) return null;

  return {
    ...returnData,
    total: Number(returnTotal),
    order_id,
  };
};

const getOrderData = async (region, orderId, options) => {
  const orderAttrs = `
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
  `;

  const orderResponse = await shopifyOrderGet(
    region,
    { orderId },
    {
      attrs: orderAttrs,
      subKey: options.subKey,
    },
  );

  return orderResponse.success
    ? orderResponse.result
    : null;
};

const calculateCreditAmount = (loopReturn, orderData) => {
  const { total: returnTotal } = loopReturn;
  const { subtotalPriceSet } = orderData;

  const orderSubtotal = parseFloat(subtotalPriceSet.shopMoney.amount);
  const orderSubtotalInPresentmentCurrency = parseFloat(subtotalPriceSet.presentmentMoney.amount);

  const finalReturnAmount = parseFloat(returnTotal);
  const exchangeRate = parseFloat(orderSubtotalInPresentmentCurrency / orderSubtotal).toFixed(6);
  const amountToCredit = finalReturnAmount * exchangeRate;
  const currencyCode = subtotalPriceSet.presentmentMoney.currencyCode;

  return {
    amountToCredit,
    currencyCode,
    exchangeRate,
  };
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
          error: `Error crediting ${customerId} with ${groupData.totalAmount} ${groupData.currencyCode} for error in crediting`,
        };
      }

      creditResults.push({
        customerGid: gidToId(customerId),
        totalAmount: groupData.totalAmount,
        currencyCode: groupData.currencyCode,
        giftCardIds: groupData.giftCardIds,
        orderIds: groupData.orderIds,
        creditResult,
      });
    } catch (error) {
      return {
        success: false,
        error: `Error crediting ${customerId} with ${groupData.totalAmount} ${groupData.currencyCode} for ${error.message}`,
        result: {
          customerId,
          totalAmount: groupData.totalAmount,
          currencyCode: groupData.currencyCode,
        },
      };
    }
  }

  return {
    success: true,
    result: creditResults,
  };
};

const getEligibleGiftCards = async (
  region,
  {
    fromDate,
    subKey,
    giftCardId,
  },
) => {
  let giftCards = [];

  if (giftCardId) {
    const result = await shopifyGiftCardsGet(region, {
      attrs: defaultAttrs,
      queries: [`id:${giftCardId}`],
    });

    giftCards = result.success
      ? result.result
      : [];
  } else {
    const result = await shopifyGiftCardsGet(region, {
      attrs: defaultAttrs,
      queries: [
        "status:enabled",
        `created_at:>=${fromDate}`,
        "source:api_client",
      ],
    });

    giftCards = result.success
      ? result.result
      : [];
  }

  if (!giftCards?.length) {
    return {
      success: true,
      result: [],
    };
  }

  const onlyEnabledGiftCards = giftCards.filter((giftCard) => giftCard.enabled);
  const storeCreditGiftCards = onlyEnabledGiftCards.filter((giftCard) => giftCard.templateSuffix === "store_credit");

  return {
    success: true,
    result: storeCreditGiftCards,
  };
};

const processGiftCard = async (region, giftCard, options) => {
  try {
    const returnId = extractReturnIdFromNote(giftCard.note);
    if (!returnId) {
      return { success: true, result: { skipped: "No return ID found" } };
    }

    const loopReturn = await getLoopReturnData(region, returnId);
    if (!loopReturn) {
      return { success: true, result: { skipped: "Loop return not found" } };
    }

    const orderData = await getOrderData(region, loopReturn.order_id, options);
    if (!orderData) {
      return { success: true, result: { skipped: "Order not found" } };
    }

    const creditCalculation = calculateCreditAmount(loopReturn, orderData);

    if (!options.demo) {
      const giftCardId = gidToId(giftCard.id);

      const deactivateResponse = await shopifyGiftCardDeactivate(region, giftCardId, {
        options: { returnAttrs: "enabled deactivatedAt" },
      });

      const deactivationValid = deactivateResponse.success === true && deactivateResponse.result?.giftCard?.enabled === false;

      if (!deactivationValid) {
        return {
          success: false,
          error: `Error disabling gift card ${giftCardId} for customer ${orderData.customer.id} store credit not given`,
          result: {
            deactivationFailed: true,
            giftCardId,
            customerGid: gidToId(orderData.customer.id),
          },
        };
      }
    }

    return {
      success: true,
      result: {
        customerGid: orderData.customer.id,
        giftCardId: gidToId(giftCard.id),
        orderId: loopReturn.order_id,
        returnId,
        ...creditCalculation,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      result: { giftCardId: giftCard.id },
    };
  }
};

const processRegion = async (region, options) => {
  try {
    const giftCardsResponse = await getEligibleGiftCards(region, options);

    // logDeep("giftCardsResponse", giftCardsResponse);
    // await askQuestion("?");

    if (!giftCardsResponse.success) {
      return {
        success: false,
        error: "Failed to get eligible gift cards",
        result: {
          region,
        },
      };
    }

    const giftCards = giftCardsResponse.result;

    // logDeep("giftCards", giftCards);
    // await askQuestion("?");

    if (!giftCards?.length) {
      return {
        success: true,
        result: {
          region,
          results: [`No eligible gift cards found in ${region}`],
          processedGiftCards: [],
          creditResults: [],
          deactivationFailures: 0,
        },
      };
    }

    const giftCardResponses = await Promise.all(giftCards.map((giftCard) => processGiftCard(region, giftCard, options)));

    // logDeep("giftCardResponses", giftCardResponses);
    // await askQuestion("?");

    const deactivationFailures = giftCardResponses.filter((r) => r.result?.deactivationFailed);

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

    const validResults = giftCardResponses.filter((r) => r.success && r.result?.customerGid);

    // logDeep("validResults", validResults);
    // await askQuestion("?");

    if (validResults.length === 0) {
      return {
        success: true,
        result: {
          region,
          results: [`No valid gift cards to process on ${region}`],
          processedGiftCards: giftCardResponses,
          creditResults: [],
          deactivationFailures: 0,
        },
      };
    }

    const customerGroups = groupResultsByCustomer(validResults.map((r) => r.result));

    // logDeep("customerGroups", customerGroups);
    // await askQuestion("?");

    const lifetimeMonthsResponse = await shopifyStoreCreditLifetimeGet(region, { subKey: options.subKey });

    if (!lifetimeMonthsResponse.success) {
      return {
        success: false,
        error: `Error getting store credit lifetime for ${region}`,
        result: {
          region,
        },
      };
    }
    const lifetimeMonths = lifetimeMonthsResponse.result;

    // logDeep("lifetimeMonths", lifetimeMonths);
    // await askQuestion("?");

    let creditResults;
    if (!options.demo) {
      const creditResultsResponse = await processCreditResults(region, customerGroups, lifetimeMonths, options);
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

    // logDeep("creditResults", creditResults);
    // await askQuestion("?");

    return {
      success: true,
      result: {
        region,
        processedGiftCards: giftCardResponses,
        customerGroups: Object.keys(customerGroups).length,
        creditResults,
        deactivationFailures: deactivationFailures.length,
        failedDeactivations: deactivationFailures,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      result: {
        region,
      },
    };
  }
};

const collabsGiftCardToStoreCredit = async ({
  regions = ["au", "us"],
  demo = false,
  giftCardId = null,
  subKey = SUB_KEY,
  daysBack = 5,
} = {}) => {
  const fromDate = dateFromNow({ minus: days(daysBack), dateOnly: true });

  const regionResponses = await Promise.all(
    regions.map((region) =>
      processRegion(region, {
        demo,
        giftCardId,
        subKey,
        fromDate,
      }),
    ),
  );

  const regionResults = arrayStandardResponse(regionResponses);

  const resultsSummary = surveyNestedArrays(regionResponses, {
    successPath: "success",
    countPaths: [
      "result.result.creditResults.length",
      "result.result.processedGiftCards.length",
      "result.result.deactivationFailures",
    ],
  });

  logDeep({ regionResults, resultsSummary });

  return { ...regionResults };
};

const collabsGiftCardToStoreCreditApi = funcApi(collabsGiftCardToStoreCredit, {
  argNames: ["options"],
  errorReporter: bedrock_unlisted_slackErrorPost,
  errorReporterPayload: {
    options: {
      logFlavourText: "collabsGiftCardToStoreCredit",
      errorChannelNameHosted: "#alerts_loop_store_credit",
      errorChannelNameLocal: "#alerts_loop_store_credit",
    },
  },
});

module.exports = {
  collabsGiftCardToStoreCredit,
  collabsGiftCardToStoreCreditApi,
};

// curl localhost:8000/collabsGiftCardToStoreCredit
// curl localhost:8000/collabsGiftCardToStoreCredit -H "Content-Type: application/json" -d '{ "options": { "demo": true, "regions": ["au"] } }'
// curl localhost:8000/collabsGiftCardToStoreCredit -H "Content-Type: application/json" -d '{ "options": { "giftCardId": "1234567890", "demo": true, "regions": ["au"] } }'
