// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsDelete

const { HOSTED } = require("../constants");
const {
  funcApi,
  logDeep,
  gidToId,
  Processor,
  arrayStandardResponse,
  actionMultipleOrSingle,
} = require("../utils");
const { shopifyMutationDo, shopifyGetter } = require("../shopify/shopify.utils");

const defaultAttrs = `deletedMetafields { key namespace } userErrors { field message }`;

const shopifyMetafieldClearSingle = async (
  credsPath,
  resourceType,
  metafieldKey,
  {
    apiVersion,
    returnAttrs = defaultAttrs,
    resourceIds = [],
    fetchOptions = {},
    query,
  } = {},
) => {
  const metafieldKeys = Array.isArray(metafieldKey)
    ? metafieldKey
    : [metafieldKey];

  const validatedKeys = metafieldKeys.map((key) => {
    const [namespace, keyName] = key.includes(".")
      ? key.split(".", 2)
      : [null, key];

    if (!namespace || !keyName) {
      throw new Error(`metafieldKey "${key}" must be in format "namespace.key"`);
    }

    return {
      namespace,
      key: keyName,
      fullKey: key,
    };
  });

  if (resourceIds.length) {
    const metafieldsToDelete = [];
    resourceIds.forEach((resourceId) => {
      validatedKeys.forEach(({ namespace, key }) => {
        metafieldsToDelete.push({
          ownerId: `gid://shopify/${
            resourceType
              .charAt(0)
              .toUpperCase() + resourceType.slice(1)
          }/${resourceId}`,
          namespace,
          key,
        });
      });
    });

    const response = await shopifyMutationDo(
      credsPath,
      "metafieldsDelete",
      {
        metafields: {
          type: "[MetafieldIdentifierInput!]!",
          value: metafieldsToDelete,
        },
      },
      returnAttrs,
      {
        apiVersion,
      },
    );

    return response;
  }

  const maxMetafieldsPerMutation = 250;
  const metafieldKeysCount = validatedKeys.length;
  const customerBatchSize = Math.floor(maxMetafieldsPerMutation / metafieldKeysCount);

  const piles = {
    resources: [],
    actionable: [],
    customerBatches: [],
    metafieldBatches: [],
    results: [],
  };

  const queries = query || validatedKeys.map(({ namespace, key }) => `metafields.${namespace}.${key}:*`);

  const attrs = `id`;

  const resourcesGetter = await shopifyGetter(credsPath, resourceType, {
    apiVersion,
    queries: Array.isArray(queries)
      ? queries
      : [queries],
    attrs,
    ...fetchOptions,

    onItems: (items) => {
      piles.resources.push(...items);
    },
    logFlavourText: `Getting ${resourceType}s on ${credsPath}`,
  });

  const qualifyingProcessor = new Processor(
    piles.resources,
    async (pile) => {
      const resource = pile.shift();
      piles.actionable.push(resource);
    },
    (pile) => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: `Qualifying ${resourceType}s on ${credsPath}`,
    },
  );

  const customerBatchingProcessor = new Processor(
    piles.actionable,
    async (pile) => {
      const batch = [];
      for (let i = 0; i < customerBatchSize && pile.length > 0; i++) {
        batch.push(pile.shift());
      }
      if (batch.length > 0) {
        piles.customerBatches.push(batch);
      }
    },
    (pile) => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: `Batching ${resourceType}s on ${credsPath} (${customerBatchSize} per batch)`,
    },
  );

  const metafieldBatchingProcessor = new Processor(
    piles.customerBatches,
    async (pile) => {
      const customerBatch = pile.shift();
      const metafieldsToDelete = [];

      customerBatch.forEach((resource) => {
        const resourceId = gidToId(resource.id);
        validatedKeys.forEach(({ namespace, key }) => {
          metafieldsToDelete.push({
            ownerId: `gid://shopify/${
              resourceType
                .charAt(0)
                .toUpperCase() + resourceType.slice(1)
            }/${resourceId}`,
            namespace,
            key,
          });
        });
      });

      piles.metafieldBatches.push(metafieldsToDelete);
    },
    (pile) => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: `Preparing metafield batches on ${credsPath}`,
    },
  );

  const metafieldClearProcessor = new Processor(
    piles.metafieldBatches,
    async (pile) => {
      const metafieldBatch = pile.shift();

      const response = await shopifyMutationDo(
        credsPath,
        "metafieldsDelete",
        {
          metafields: {
            type: "[MetafieldIdentifierInput!]!",
            value: metafieldBatch,
          },
        },
        returnAttrs,
        {
          apiVersion,
        },
      );

      piles.results.push(response);
    },
    (pile) => pile.length === 0,
    {
      canFinish: false,
      runOptions: {
        interval: 100,
      },
      maxInFlightRequests: 10,
      logFlavourText: `Clearing metafield batches on ${credsPath}`,
    },
  );

  resourcesGetter.on("done", () => {
    qualifyingProcessor.canFinish = true;
  });

  qualifyingProcessor.on("done", () => {
    customerBatchingProcessor.canFinish = true;
  });

  customerBatchingProcessor.on("done", () => {
    metafieldBatchingProcessor.canFinish = true;
  });

  metafieldBatchingProcessor.on("done", () => {
    metafieldClearProcessor.canFinish = true;
  });

  await Promise.all([
    resourcesGetter.run({ verbose: !HOSTED }),
    qualifyingProcessor.run({ verbose: false }),
    customerBatchingProcessor.run({ verbose: false }),
    metafieldBatchingProcessor.run({ verbose: false }),
    metafieldClearProcessor.run({ verbose: !HOSTED }),
  ]);

  const response = arrayStandardResponse(piles.results);
  !HOSTED && logDeep(response);
  return response;
};

const shopifyMetafieldClear = async (credsPath, resourceType, metafieldKey, { queueRunOptions = { interval: 1 }, ...options } = {}) => {
  const response = await actionMultipleOrSingle(
    credsPath,
    shopifyMetafieldClearSingle,
    (credsPath) => ({
      args: [
        credsPath,
        resourceType,
        metafieldKey,
      ],
      options,
    }),
    {
      ...(queueRunOptions
        ? { queueRunOptions }
        : {}),
    },
  );

  !HOSTED && logDeep(response);
  return response;
};

const shopifyMetafieldClearApi = funcApi(shopifyMetafieldClear, {
  argNames: [
    "credsPath",
    "resourceType",
    "metafieldKey",
    "options",
  ],
});

module.exports = {
  shopifyMetafieldClear,
  shopifyMetafieldClearSingle,
  shopifyMetafieldClearApi,
};

// Processor-based (streams all matching resources):
// curl http://localhost:8000/shopifyMetafieldClear -H 'Content-Type: application/json' -d '{ "credsPath": "au", "resourceType": "customer", "metafieldKey": ["custom.notes", "custom.tags"], "options": {} }'

// Multiple stores:
// curl http://localhost:8000/shopifyMetafieldClear -H 'Content-Type: application/json' -d '{ "credsPath": ["au", "us", "uk"], "resourceType": "customer", "metafieldKey": "custom.notes", "options": {} }'

// Original synchronous (for specific resourceIds):
// curl http://localhost:8000/shopifyMetafieldClear -H 'Content-Type: application/json' -d '{ "credsPath": "au", "resourceType": "customer", "metafieldKey": "custom.notes", "options": { "resourceIds": ["123", "456"] } }'

