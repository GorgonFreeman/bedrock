// https://shopify.dev/docs/api/admin-graphql/latest/mutations/tagsAdd
// Product search: https://shopify.dev/docs/api/usage/search-syntax

const { funcApi } = require("../utils");
const { shopifyCredsPathDistill } = require("../shopify/shopify.utils");
const {
  shopifyStaleCompleteTheLook,
} = require("./shopifyStaleCompleteTheLook");
const { shopifyTagsAdd } = require("./shopifyTagsAdd");

const DEFAULT_COMPLETE_THE_LOOK_REVIEW_TAG = "complete_the_look_review";

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
 * Runs `shopifyStaleCompleteTheLook` on products **not** already tagged, then adds the tag to each
 * **parent** product that has at least one sold-out Complete the Look pick.
 *
 * Tag applied: `{tagBase}_{region}` (default base `complete_the_look_review`). **Region** is always
 * the first segment of `credsPath` (e.g. `credsPath: "au"` → `complete_the_look_review_au`).
 *
 * @param {string} credsPath — store credentials path; first segment is the region suffix for the tag
 * @param {object} [options]
 * @param {string} [options.tag] — base tag before `_region` (default: `complete_the_look_review`)
 */
const shopifyStaleCompleteTheLookTag = async (credsPath, options = {}) => {
  const { tag: tagOption } = options;

  const { region } = shopifyCredsPathDistill(credsPath);

  const tagBase = resolveTagBase(tagOption);
  const tag = buildRegionTag(tagBase, region);

  const excludeClause = productSearchExcludeTagClause(tag);
  const stale = await shopifyStaleCompleteTheLook(credsPath, {
    ...(excludeClause && { queries: [excludeClause] }),
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

  const parentIds = parents.map((entry) => entry.parent.id);

  const baseResult = {
    tag,
    tagBase,
    region,
    productSearchQuery: excludeClause || null,
    parentIdsTagged: parentIds,
    tagged: parentIds.length,
    stale: stale.result,
  };

  if (parentIds.length === 0) {
    return {
      success: true,
      result: baseResult,
    };
  }

  const tagsResponse = await shopifyTagsAdd(credsPath, parentIds, [tag], {
    queueRunOptions: {
      interval: 20,
    },
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
};

// curl http://localhost:8000/shopifyStaleCompleteTheLookTag -H 'Content-Type: application/json' -d '{ "credsPath": "au", "options": {} }'
// → tag `complete_the_look_review_au`, scan excludes products already with that tag
// curl http://localhost:8000/shopifyStaleCompleteTheLookTag -H 'Content-Type: application/json' -d '{ "credsPath": "us", "options": { "tag": "ctl_review" } }'
// → tag `ctl_review_us`
