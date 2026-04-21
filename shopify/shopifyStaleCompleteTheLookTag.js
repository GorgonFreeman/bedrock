// https://shopify.dev/docs/api/admin-graphql/latest/mutations/tagsAdd
// Product search: https://shopify.dev/docs/api/usage/search-syntax
//
// Product sync: **AU is the source region**; US/UK (etc.) follow AU. If something exists on a
// regional store but not on AU, sync removes it. Regional products therefore carry `custom.id` =
// the **AU** product id (digits only). Flow: run the stale-CTL scan on the regional `scanCredsPath`,
// read each parent’s `custom.id`, build `gid://shopify/Product/{id}`, then `tagsAdd` on **AU**
// (`credsPath` — the base/canonical store).

const { funcApi } = require("../utils");
const { shopifyCredsPathDistill } = require("../shopify/shopify.utils");
const {
  shopifyStaleCompleteTheLook,
} = require("./shopifyStaleCompleteTheLook");
const { shopifyTagsAdd } = require("./shopifyTagsAdd");

const DEFAULT_COMPLETE_THE_LOOK_REVIEW_TAG = "complete_the_look_review";

/**
 * Scan-side metafield: other regions store the **AU (tag-store) product id** here, without the
 * `gid://shopify/Product/` prefix. Cross-region tagging builds that GID on `credsPath` directly.
 */
const CUSTOM_ID_METAFIELD = { namespace: "custom", key: "id" };

/**
 * @param {string|number} customId — AU numeric product id, or full `gid://shopify/Product/…`
 * @returns {{ ok: true, gid: string } | { ok: false, reason: string }}
 */
const auProductGidFromCustomId = (customId) => {
  const raw = String(customId ?? "").trim();
  if (!raw) {
    return { ok: false, reason: "empty" };
  }
  const fromGid = /^gid:\/\/shopify\/Product\/(\d+)$/i.exec(raw);
  const digits = fromGid ? fromGid[1] : raw;
  if (!/^\d+$/.test(digits)) {
    return { ok: false, reason: "not_numeric_product_id" };
  }
  return { ok: true, gid: `gid://shopify/Product/${digits}` };
};

const resolveTagBase = (tag) => {
  if (tag === undefined || tag === null) {
    return DEFAULT_COMPLETE_THE_LOOK_REVIEW_TAG;
  }
  const s = String(tag).trim();
  return s === "" ? DEFAULT_COMPLETE_THE_LOOK_REVIEW_TAG : s;
};

/** Shopify Admin `products` search: exclude products that already have this tag (`-tag:...`). */
const productSearchExcludeTagClause = (fullTag) => {
  const t = String(fullTag).trim();
  if (!t) {
    return null;
  }
  if (/[\s"]/.test(t)) {
    return `-tag:"${t.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return `-tag:${t}`;
};

/**
 * @param {string} resolvedBase — already normalized base tag
 * @param {string} [region] — e.g. `au`; omitted/empty → no suffix
 * @returns {string} e.g. `complete_the_look_review_au`
 */
const buildRegionTag = (resolvedBase, region) => {
  const r =
    region !== undefined && region !== null ? String(region).trim() : "";
  if (!r) {
    return resolvedBase;
  }
  return `${resolvedBase}_${r}`;
};

/**
 * Runs the stale Complete the Look scan (optionally on **another** store), then tags matching
 * **parent** products on **`credsPath`** (canonical / base store — AU in your sync).
 *
 * - **`credsPath`**: where `tagsAdd` runs; `shopifyCredsPathDistill(credsPath).region` drives the
 *   `_region` suffix on the tag (e.g. `complete_the_look_review_au`).
 * - **`options.scanCredsPath`**: Admin store to scan (US, UK, …); defaults to `credsPath` when you
 *   only need one store.
 * - Cross-store: scan finds parents with sold-out CTL refs on the regional store; each parent’s
 *   **`custom.id`** is the **AU** numeric product id → `gid://shopify/Product/{id}` on `credsPath`.
 *
 * When scan and tag use the same `credsPath`, products already carrying the full tag are excluded
 * from the scan via `-tag:…`. When they differ, that exclude is not applied on the scan store.
 *
 * @param {string} credsPath — tag target store (e.g. `au`)
 * @param {object} [options]
 * @param {string} [options.tag] — base tag before `_region` (default: `complete_the_look_review`)
 * @param {string} [options.scanCredsPath] — scan store (default: same as `credsPath`)
 */
const shopifyStaleCompleteTheLookTag = async (credsPath, options = {}) => {
  const {
    tag: tagOption,
    scanCredsPath: scanCredsPathOption,
    apiVersion,
  } = options;

  const tagCredsPath = credsPath;
  const scanCredsPath =
    scanCredsPathOption !== undefined && scanCredsPathOption !== null
      ? String(scanCredsPathOption).trim()
      : tagCredsPath;

  const crossRegion = scanCredsPath !== tagCredsPath;

  const { region } = shopifyCredsPathDistill(tagCredsPath);

  const tagBase = resolveTagBase(tagOption);
  const tag = buildRegionTag(tagBase, region);

  const excludeClause = productSearchExcludeTagClause(tag);
  const sameStore = scanCredsPath === tagCredsPath;

  const stale = await shopifyStaleCompleteTheLook(scanCredsPath, {
    ...(sameStore && excludeClause && { queries: [excludeClause] }),
    ...(apiVersion && { apiVersion }),
  });

  if (!stale.success) {
    return stale;
  }

  const parents = stale.result?.parents;
  if (!Array.isArray(parents)) {
    return {
      success: false,
      error: [{ message: "Stale scan result missing parents array" }],
    };
  }

  const resolutionErrors = [];
  const parentIds = [];

  if (sameStore) {
    for (const entry of parents) {
      parentIds.push(entry.parent.id);
    }
  } else {
    for (const entry of parents) {
      const cid = entry.parent.customId;
      if (cid == null || String(cid).trim() === "") {
        resolutionErrors.push({
          scanParentId: entry.parent.id,
          scanParentHandle: entry.parent.handle,
          message: "missing custom.id metafield value on scan store",
        });
        continue;
      }
      const gidRes = auProductGidFromCustomId(cid);
      if (!gidRes.ok) {
        resolutionErrors.push({
          scanParentId: entry.parent.id,
          scanParentHandle: entry.parent.handle,
          customId: cid,
          message:
            gidRes.reason === "empty"
              ? "missing custom.id metafield value on scan store"
              : "custom.id must be AU numeric product id or gid://shopify/Product/…",
        });
        continue;
      }
      parentIds.push(gidRes.gid);
    }
  }

  const baseResult = {
    tag,
    tagBase,
    region,
    tagCredsPath,
    scanCredsPath,
    crossRegion,
    productSearchQuery: sameStore ? excludeClause || null : null,
    crossRegionAuGidFromCustomId: crossRegion ? true : null,
    parentIdsTagged: parentIds,
    tagged: parentIds.length,
    resolutionErrors:
      resolutionErrors.length > 0 ? resolutionErrors : undefined,
    stale: stale.result,
  };

  if (parentIds.length === 0) {
    return {
      success: resolutionErrors.length === 0,
      ...(resolutionErrors.length > 0 && {
        error: [
          {
            message:
              "No tag-store products resolved; see result.resolutionErrors",
          },
        ],
      }),
      result: baseResult,
    };
  }

  const tagsResponse = await shopifyTagsAdd(tagCredsPath, parentIds, [tag], {
    queueRunOptions: {
      interval: 50,
    },
    ...(apiVersion && { apiVersion }),
  });

  if (!tagsResponse.success) {
    return {
      success: false,
      ...(tagsResponse.error && { error: tagsResponse.error }),
      result: {
        ...baseResult,
        tagsAdd: tagsResponse,
      },
    };
  }

  return {
    success: true,
    result: {
      ...baseResult,
      tagsAdd: tagsResponse,
    },
  };
};

const shopifyStaleCompleteTheLookTagApi = funcApi(
  shopifyStaleCompleteTheLookTag,
  {
    argNames: ["credsPath", "options"],
    validatorsByArg: {
      credsPath: Boolean,
    },
  },
);

module.exports = {
  shopifyStaleCompleteTheLookTag,
  shopifyStaleCompleteTheLookTagApi,
  DEFAULT_COMPLETE_THE_LOOK_REVIEW_TAG,
  CUSTOM_ID_METAFIELD,
};

// Same store (AU scan + AU tag), excludes already tagged:
// curl http://localhost:8000/shopifyStaleCompleteTheLookTag -H 'Content-Type: application/json' -d '{ "credsPath": "au" }'
//
// Scan US, tag AU — `custom.id` on US parents = AU numeric product id → GID on AU:
// curl http://localhost:8000/shopifyStaleCompleteTheLookTag -H 'Content-Type: application/json' -d '{ "credsPath": "au", "options": { "scanCredsPath": "us" } }'
// curl http://localhost:8000/shopifyStaleCompleteTheLookTag -H 'Content-Type: application/json' -d '{ "credsPath": "au", "options": { "scanCredsPath": "uk" } }'
