// https://shopify.dev/docs/api/admin-graphql/latest/mutations/tagsAdd

const { funcApi } = require("../utils");
const {
  shopifyStaleCompleteTheLook,
} = require("./shopifyStaleCompleteTheLook");
const { shopifyTagsAdd } = require("./shopifyTagsAdd");

const DEFAULT_COMPLETE_THE_LOOK_REVIEW_TAG = "complete_the_look_review";

const resolveTag = (tag) => {
  if (tag === undefined || tag === null) {
    return DEFAULT_COMPLETE_THE_LOOK_REVIEW_TAG;
  }
  const s = String(tag).trim();
  return s === "" ? DEFAULT_COMPLETE_THE_LOOK_REVIEW_TAG : s;
};

/**
 * Runs `shopifyStaleCompleteTheLook` with default fetch options, then adds a tag to each **parent**
 * product that has at least one sold-out Complete the Look pick.
 *
 * @param {string} credsPath
 * @param {object} [options]
 * @param {string} [options.tag] — tag to add (default: `complete_the_look_review`). Nothing else is needed.
 */
const shopifyStaleCompleteTheLookTag = async (credsPath, options = {}) => {
  const { tag: tagOption } = options;
  const tag = resolveTag(tagOption);

  const stale = await shopifyStaleCompleteTheLook(credsPath, {});
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
// curl http://localhost:8000/shopifyStaleCompleteTheLookTag -H 'Content-Type: application/json' -d '{ "credsPath": "au", "options": { "tag": "my_review_tag" } }'
