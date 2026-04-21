// https://shopify.dev/docs/api/admin-graphql/latest/queries/products
// Product inventory: https://shopify.dev/docs/api/admin-graphql/latest/objects/Product#fields

const { funcApi } = require("../utils");
const { shopifyGetter } = require("../shopify/shopify.utils");
const { shopifyProductsGet } = require("../shopify/shopifyProductsGet");

// `tracksInventory` + `totalInventory` (validated Admin API).
const defaultAttrs = `
  id
  handle
  title
  totalInventory
  tracksInventory
  ctl: metafield(namespace: "related_products", key: "complete_the_look") {
    value
    type
  }
`;

/** Inventory sold out for tracked products (nothing left to sell). Untracked products are not flagged. */
const productIsInventorySoldOut = (p) => {
  if (p.tracksInventory === false) {
    return false;
  }
  const t = p.totalInventory;
  return t === 0 || t == null;
};

const payloadMaker = (credsPath, { attrs = defaultAttrs, ...options } = {}) => {
  return [
    credsPath,
    "product",
    {
      ...options,
      attrs,
    },
  ];
};

/**
 * Fetches products once, builds a gid map, then for each product with Complete the Look
 * (list.product_reference), lists referenced products that exist in the catalog and are
 * inventory sold out — so those GIDs can be removed from the metafield.
 *
 * Success shape: `result.summary`, `result.parents` (grouped), `result.rows` (flat, one line per bad ref).
 *
 * @param {string} credsPath
 * @param {object} [options] — passed through to `shopifyProductsGet` except `attrs`
 */
const shopifyStaleCompleteTheLook = async (credsPath, options = {}) => {
  const {
    attrs: attrsOption,
    keyBy: _legacyKeyBy,
    ...productsOptions
  } = options;

  const productsResponse = await shopifyProductsGet(credsPath, {
    ...productsOptions,
    attrs: attrsOption !== undefined ? attrsOption : defaultAttrs,
  });

  if (!productsResponse.success) {
    return productsResponse;
  }

  const products = productsResponse.result;
  const byGid = new Map();
  for (const p of products) {
    byGid.set(p.id, p);
  }

  /** @type {Array<{ parent: object, soldOutReferences: object[] }>} */
  const parents = [];

  for (const parent of products) {
    const ctl = parent.ctl;
    if (!ctl?.value) {
      continue;
    }

    let refGids;
    try {
      refGids = JSON.parse(ctl.value);
    } catch {
      continue;
    }

    if (!Array.isArray(refGids)) {
      continue;
    }

    const soldOutReferences = [];

    for (const refGid of refGids) {
      const ref = byGid.get(refGid);
      if (!ref) {
        continue;
      }
      if (!productIsInventorySoldOut(ref)) {
        continue;
      }
      soldOutReferences.push({
        id: ref.id,
        handle: ref.handle,
        title: ref.title,
      });
    }

    if (soldOutReferences.length === 0) {
      continue;
    }

    parents.push({
      parent: {
        id: parent.id,
        handle: parent.handle,
        title: parent.title,
      },
      soldOutReferences,
    });
  }

  parents.sort((a, b) =>
    (a.parent.handle || "").localeCompare(b.parent.handle || "", undefined, {
      sensitivity: "base",
    }),
  );

  const rows = [];
  for (const p of parents) {
    for (const ref of p.soldOutReferences) {
      rows.push({
        parentHandle: p.parent.handle,
        parentTitle: p.parent.title,
        parentId: p.parent.id,
        soldOutHandle: ref.handle,
        soldOutTitle: ref.title,
        soldOutId: ref.id,
      });
    }
  }

  return {
    success: true,
    result: {
      summary: {
        parentsAffected: parents.length,
        soldOutReferencesTotal: rows.length,
      },
      parents,
      rows,
    },
  };
};

const shopifyStaleCompleteTheLookGetter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const shopifyStaleCompleteTheLookApi = funcApi(shopifyStaleCompleteTheLook, {
  argNames: ["credsPath", "options"],
  validatorsByArg: {
    credsPath: Boolean,
  },
});

module.exports = {
  shopifyStaleCompleteTheLook,
  shopifyStaleCompleteTheLookGetter,
  shopifyStaleCompleteTheLookApi,
};

// curl localhost:8000/shopifyStaleCompleteTheLook -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "queries": ["status:active"] } }'

