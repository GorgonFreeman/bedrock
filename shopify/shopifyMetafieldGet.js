const { funcApi, logDeep } = require("../utils");
const { shopifyGetSingle } = require("../shopify/shopifyGetSingle");

const shopifyMetafieldGet = async (
  credsPath,
  {
    resource,
    resourceId,
    namespace,
    key,
  },
  { apiVersion, subKey } = {},
) => {
  const metafieldsArgs = [
    "first: 10",
    namespace
      ? `namespace: "${namespace}"`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  const attrs = `
    id
    metafields(${metafieldsArgs}) {
      edges {
        node {
          id
          key
          namespace
          reference
          value
          type
        }
      }
    }
  `;

  const response = await shopifyGetSingle(credsPath, resource, resourceId, {
    apiVersion,
    subKey,
    attrs,
  });

  if (!response.success) {
    return response;
  }

  const metafields = response.result?.metafields || [];
  const metafield = metafields.find((mf) => mf.key === key);

  if (!metafield) {
    return {
      success: false,
      error: [`Metafield with key '${key}' not found`],
    };
  }

  const finalResponse = {
    success: true,
    result: metafield,
  };

  logDeep(finalResponse);
  return finalResponse;
};

const shopifyMetafieldGetApi = funcApi(shopifyMetafieldGet, {
  argNames: [
    "credsPath",
    "metafieldQuery",
    "options",
  ],
});

module.exports = {
  shopifyMetafieldGet,
  shopifyMetafieldGetApi,
};

// curl localhost:8000/shopifyMetafieldGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "metafieldQuery": { "resource": "shop", "resourceId": "shop", "namespace": "store_credit", "key": "lifetime_months" } }'
