// https://shopify.dev/docs/api/admin-graphql/latest/queries/metafield

const { funcApi, logDeep } = require("../utils");
const { shopifyMetafieldGet } = require("../shopify/shopifyMetafieldGet");

const shopifyStoreCreditLifetimeGet = async (credsPath, { subKey = "store_credit" } = {}) => {
  const metafieldResponse = await shopifyMetafieldGet(
    credsPath,
    {
      resource: "shop",
      resourceId: "shop",
      namespace: "store_credit",
      key: "lifetime_months",
    },
    { subKey },
  );

  if (!metafieldResponse.success) {
    return {
      success: false,
      error: ["Store credit lifetime metafield not found"],
    };
  }

  try {
    const lifetimeMonths = parseInt(metafieldResponse.result.value);

    if (isNaN(lifetimeMonths)) {
      return {
        success: false,
        error: ["Invalid lifetime months value"],
      };
    }

    const response = {
      success: true,
      result: lifetimeMonths,
    };

    logDeep(response);
    return response;
  } catch (err) {
    return {
      success: false,
      error: [err.message],
    };
  }
};

const shopifyStoreCreditLifetimeGetApi = funcApi(shopifyStoreCreditLifetimeGet, {
  argNames: ["credsPath", "options"],
});

module.exports = {
  shopifyStoreCreditLifetimeGet,
  shopifyStoreCreditLifetimeGetApi,
};

// curl localhost:8000/shopifyStoreCreditLifetimeGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "subKey": "store_credit" } }'
