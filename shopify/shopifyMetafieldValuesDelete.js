const { funcApi, logDeep, surveyNestedArrays, Processor, FakeGetter, actionMultipleOrSingle } = require('../utils');
const { shopifyGetter } = require('../shopify/shopify.utils');
const { shopifyMetafieldsDelete } = require('../shopify/shopifyMetafieldsDelete');
const { shopifyBulkOperationDo } = require('../shopify/shopifyBulkOperationDo');

const {
  MAX_METAFIELDS_PER_SET,
} = require('../shopify/shopify.constants');

const shopifyMetafieldValuesDeleteSingle = async (
  store,
  resource,
  metafieldPath,
  {
    apiVersion,
    useBulkFetch = false,
  } = {},
) => {

  logDeep({
    store,
    resource,
    metafieldPath,
  });

  const piles = {
    resources: [],
    shopifyMetafieldsDelete: [],
    results: [],
  };

  const [mfNamespace, mfKey] = metafieldPath.split('.');

  const attrs = `
    id
    targetMetafield: metafield(namespace: "${ mfNamespace }", key: "${ mfKey }") {
      id
      type
      value
    }
  `;

  let getter;

  if (useBulkFetch) {

    const shopifyBulkQuery = `{
      ${ resource }s(query: "metafields.${ mfNamespace }.${ mfKey }:*") {
        edges {
          node {
            ${ attrs }
          }
        }
      }
    }`;

    getter = new FakeGetter(
      shopifyBulkOperationDo,
      [
        store,
        'query',
        shopifyBulkQuery,
        {
          apiVersion,
        },
      ],
      {
        onItems: (items) => {
          for (const item of items) {
            if (item?.targetMetafield) {
              piles.resources.push(item);
            }
          }
        },
        onDone: () => {
          logDeep(surveyNestedArrays(piles));
        },
      },
    );

  } else {
    getter = await shopifyGetter(
      store,
      resource,
      {
        queries: [`metafields.${ mfNamespace }.${ mfKey }:*`],
        attrs,

        apiVersion,

        onItems: (items) => {
          piles.resources.push(...items);

          logDeep(surveyNestedArrays(piles));
          logDeep(piles.resources[piles.resources.length - 1]);
        },
      },
    );
  }

  const assessor = new Processor(
    piles.resources,
    async (pile) => {
      const resourceRow = pile.shift();
      const { id: resourceGid, targetMetafield } = resourceRow;

      if (!targetMetafield) {
        return;
      }

      piles.shopifyMetafieldsDelete.push({
        ownerId: resourceGid,
        namespace: mfNamespace,
        key: mfKey,
      });
    },
    pile => pile.length === 0,
    {
      canFinish: false,
    },
  );

  getter.on('done', () => {
    assessor.canFinish = true;
  });

  const actioner = new Processor(
    piles.shopifyMetafieldsDelete,
    async (pile) => {
      const metafieldPayloads = pile.splice(0, MAX_METAFIELDS_PER_SET);

      logDeep(metafieldPayloads);

      const response = await shopifyMetafieldsDelete(
        store,
        metafieldPayloads,
        {
          apiVersion,
        },
      );

      if (!response?.success) {
        console.error(response);
      }

      piles.results.push(response);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: 'shopifyMetafieldsDelete',
    },
  );

  assessor.on('done', () => {
    actioner.canFinish = true;
  });

  await Promise.all([
    getter.run(),
    assessor.run(),
    actioner.run(),
  ]);

  return {
    success: true,
    result: surveyNestedArrays(piles),
  };
};

const shopifyMetafieldValuesDelete = async (
  store,
  resource,
  metafieldPath,
  {
    queueRunOptions,
    ...options
  } = {},
) => {

  const response = await actionMultipleOrSingle(
    store,
    shopifyMetafieldValuesDeleteSingle,
    (storeSingle) => ({
      args: [storeSingle, resource, metafieldPath],
      options,
    }),
    {
      ...(queueRunOptions ? { queueRunOptions } : {}),
    },
  );

  logDeep(response);
  return response;
};

const shopifyMetafieldValuesDeleteApi = funcApi(shopifyMetafieldValuesDelete, {
  argNames: ['store', 'resource', 'metafieldPath', 'options'],
  validatorsByArg: {
    store: (p) => {
      if (Array.isArray(p)) {
        return p.length > 0 && p.every(Boolean);
      }
      return Boolean(p);
    },
    resource: Boolean,
    metafieldPath: p => p.includes('.'),
  },
});

module.exports = {
  shopifyMetafieldValuesDelete,
  shopifyMetafieldValuesDeleteSingle,
  shopifyMetafieldValuesDeleteApi,
};

// curl localhost:8000/shopifyMetafieldValuesDelete -H "Content-Type: application/json" -d '{ "store": "au", "resource": "customer", "metafieldPath": "competitions.entries_string" }'
// curl localhost:8000/shopifyMetafieldValuesDelete -H "Content-Type: application/json" -d '{ "store": ["au", "us"], "resource": "customer", "metafieldPath": "competitions.entries_string" }'
