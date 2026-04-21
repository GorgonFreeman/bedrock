// https://shopify.dev/docs/api/admin-graphql/latest/queries/products
// Product inventory: https://shopify.dev/docs/api/admin-graphql/latest/objects/Product#fields

const { HOSTED } = require("../constants");
const { funcApi } = require("../utils");
const { shopifyGetter } = require("../shopify/shopify.utils");
const { shopifyProductsGet } = require("../shopify/shopifyProductsGet");

/** Shared product id across stores: `custom.id` metafield. */
const defaultAttrs = `
  id
  handle
  title
  totalInventory
  tracksInventory
  customId: metafield(namespace: "custom", key: "id") {
    value
    type
  }
  ctl: metafield(namespace: "related_products", key: "complete_the_look") {
    value
    type
  }
`;
// Metafield type is list.product_reference: JSON array of product GIDs (Complete the Look picks).

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
 * Fetches products once, builds a gid map, then for each product whose Complete the Look
 * metafield is set: that metafield is an **array** of product references (`list.product_reference`).
 * We walk that array and list which referenced products are inventory sold out so those GIDs
 * can be removed from the array.
 *
 * Success `result` shape:
 * - `summary` — `productsFetched` (catalog rows loaded), `parentsAffected`, `soldOutReferencesTotal`.
 * - `parents` — **one entry per top-level product** (the product that owns the CTL metafield).
 *   Each entry has `parent` (that product) and `soldOutReferences` (**array**: sold-out CTL picks,
 *   **unique by referenced product GID** — duplicate GIDs in the metafield JSON are ignored).
 *   `parent.customId` is the **`custom.id`** metafield value (same logical product on another store).
 * - `rows` — **one entry per sold-out referenced product** (denormalized). If a parent has three
 *   bad refs, you get **three** rows with the same `parent*` fields and three different
 *   `referencedProduct*` fields — singular names because each row describes **one** ref.
 *
 * @param {string} credsPath
 * @param {object} [options] — passed through to `shopifyProductsGet` except `attrs`, `keyBy`
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

    // Metafield array can list the same product GID more than once; process each ref once.
    const uniqueRefGids = [...new Set(refGids)];

    const soldOutReferences = [];

    for (const refGid of uniqueRefGids) {
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

    const customRaw = parent.customId;
    const customId =
      typeof customRaw === "string" ? customRaw : customRaw?.value ?? null;

    parents.push({
      parent: {
        id: parent.id,
        handle: parent.handle,
        title: parent.title,
        customId,
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
        parentCustomId: p.parent.customId,
        referencedProductId: ref.id,
        referencedProductHandle: ref.handle,
        referencedProductTitle: ref.title,
      });
    }
  }

  const summary = {
    productsFetched: products.length,
    parentsAffected: parents.length,
    soldOutReferencesTotal: rows.length,
  };

  if (!HOSTED) {
    console.log(
      `[shopifyStaleCompleteTheLook] productsFetched=${summary.productsFetched} parentsAffected=${summary.parentsAffected} soldOutReferencesTotal=${summary.soldOutReferencesTotal}`,
    );
  }

  return {
    success: true,
    result: {
      summary: {
        parentsAffected: summary.parentsAffected,
        soldOutReferencesTotal: summary.soldOutReferencesTotal,
        productsFetched: summary.productsFetched,
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
