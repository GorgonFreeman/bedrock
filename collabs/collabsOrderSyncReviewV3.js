const { funcApi, surveyNestedArrays, logDeep, askQuestion, Processor, gidToId, ThresholdActioner } = require('../utils');

const {
  REGIONS_PIPE17,
  REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyBulkOperationDo } = require('../shopify/shopifyBulkOperationDo');
const { shopifyTagsAdd } = require('../shopify/shopifyTagsAdd');

const { pipe17OrdersGetter } = require('../pipe17/pipe17OrdersGet');
const { pipe17OrderGet } = require('../pipe17/pipe17OrderGet');

const { bleckmannPickticketsGetter } = require('../bleckmann/bleckmannPickticketsGet');
const { bleckmannPickticketGet } = require('../bleckmann/bleckmannPickticketGet');

const collabsOrderSyncReviewV3 = async (
  region,
  {
    option,
  } = {},
) => {

  const piles = {
    shopifyOrders: [],
    found: [],
    tagged: [],
    errors: [],
    missing: [],
  };
  
  // 1. Get open orders from Shopify
  const shopifyQueriesByRegion = {
    au: [
      `tag_not:'Sync:Confirmed'`,
    ],
    us: [
      `tag:'sync-to-radial'`,
    ],
  };

  const shopifyQueries = [
    'created_at:>2025-07-01',
    '(fulfillment_status:unshipped OR fulfillment_status:partial)',
    'status:open',
    'delivery_method:shipping',
    `tag_not:'order_sync_review_exclude'`,
    `tag_not:'sync_confirmed'`,
    ...(shopifyQueriesByRegion?.[region] || []),
  ];

  const shopifyOrdersQuery = `{
    orders(query: "${ shopifyQueries.join(' AND ') }", sortKey: CREATED_AT) {
      edges {
        node {
          id
          name
          createdAt
        }
      }
    }
  }`;

  const shopifyOrdersResponse = await shopifyBulkOperationDo(
    region,
    'query',
    shopifyOrdersQuery,
  );

  const { success: shopifyOrdersSuccess, result: shopifyOrders } = shopifyOrdersResponse;
  if (!shopifyOrdersSuccess) {
    return shopifyOrdersResponse;
  }

  if (shopifyOrders.length === 0) {
    return {
      success: true,
      result: `No orders to review`,
    };
  }

  // TODO: Consider when to filter out recent half hour, to give an acceptable sync delay
  
  piles.shopifyOrders.push(...shopifyOrders);
  
  // 2. Get oldest date for future fetching
  const oldestDate = shopifyOrders?.[0]?.createdAt;

  // 3. Get bulk orders from WMS
  const fetchers = [];
  const processors = [];

  // Check orders from the front in bulk, and from the back individually.

  if (REGIONS_PIPE17.includes(region)) {

    piles.pipe17Orders = [];

    const pipe17OrdersFetcher = await pipe17OrdersGetter({
      since: oldestDate,
      keys: 'extOrderId',
      order: '-createdAt',

      onItems: (items) => {
        piles.pipe17Orders.push(...items);
      },

      logFlavourText: `pipe17OrdersFetcher:`,
    });

    const pipe17OrdersProcessor = new Processor(
      piles.pipe17Orders,
      async (pile) => {

        const pipe17Order = pile.shift();

        logDeep(pipe17Order);

        const { extOrderId: orderName } = pipe17Order;

        const shopifyOrder = piles.shopifyOrders.find(o => o.name === orderName);

        if (!shopifyOrder) {
          return false;
        }

        piles.found.push(shopifyOrder);

        const orderIndex = piles.shopifyOrders.indexOf(shopifyOrder);
        if (orderIndex === -1) {
          return false;
        }
        piles.shopifyOrders.splice(orderIndex, 1);
        return true;
      },
      pile => pile.length === 0,
      {
        canFinish: false,
        logFlavourText: `pipe17OrdersProcessor:`,
      },
    );

    pipe17OrdersFetcher.on('items', () => {
      if (piles.shopifyOrders.length === 0) {
        pipe17OrdersFetcher.end();
      }
    });

    pipe17OrdersFetcher.on('done', () => {
      pipe17OrdersProcessor.canFinish = true;
    });

    fetchers.push(pipe17OrdersFetcher);
    processors.push(pipe17OrdersProcessor);

    const pipe17ThoroughProcessor = new Processor(
      piles.shopifyOrders,
      async (pile) => {

        const shopifyOrder = pile.shift();
        const { id: orderGid } = shopifyOrder;
        const orderId = gidToId(orderGid);

        const pipe17OrderResponse = await pipe17OrderGet({ extOrderApiId: orderId });
        const { success: pipe17OrderSuccess, result: pipe17Order } = pipe17OrderResponse;
        if (!pipe17OrderSuccess) {

          if (pipe17OrderResponse?.error?.some(e => e?.data?.message === 'No results')) {
            piles.missing.push(shopifyOrder);
            return false;
          }

          piles.errors.push({
            shopifyOrder,
            pipe17OrderResponse,
          });
          return false;
        }

        if (pipe17Order?.extOrderApiId !== orderId) {
          return false;
        }

        piles.found.push(shopifyOrder);
      },
      pile => pile.length === 0,
      {
        canFinish: true,
        logFlavourText: `pipe17ThoroughProcessor:`,
      },
    );

    processors.push(pipe17ThoroughProcessor);
  }

  if (REGIONS_BLECKMANN.includes(region)) {

    piles.bleckmannOrders = [];

    const bleckmannOrdersFetcher = await bleckmannPickticketsGetter({
      createdFrom: oldestDate,

      onItems: (items) => {
        piles.bleckmannOrders.push(...items);
      },

      logFlavourText: `bleckmannOrdersFetcher:`,
    });

    const bleckmannOrdersProcessor = new Processor(
      piles.bleckmannOrders,
      async (pile) => {
        const bleckmannOrder = pile.shift();
        const { reference } = bleckmannOrder;

        const shopifyOrder = piles.shopifyOrders.find(o => o.name === reference);

        if (!shopifyOrder) {
          return false;
        }

        piles.found.push(shopifyOrder);

        const orderIndex = piles.shopifyOrders.indexOf(shopifyOrder);
        if (orderIndex === -1) {
          return false;
        }
        piles.shopifyOrders.splice(orderIndex, 1);
      },
      pile => pile.length === 0,
      {
        canFinish: false,
        logFlavourText: `bleckmannOrdersProcessor:`,
      },
    );

    bleckmannOrdersFetcher.on('items', () => {
      if (piles.shopifyOrders.length === 0) {
        bleckmannOrdersFetcher.end();
      }
    });

    bleckmannOrdersFetcher.on('done', () => {
      bleckmannOrdersProcessor.canFinish = true;
    });

    fetchers.push(bleckmannOrdersFetcher);
    processors.push(bleckmannOrdersProcessor);

  }

  const tagger = new Processor(
    piles.found,
    async (pile) => {
      const orderGids = pile.splice(0).map(o => o.id);

      const tagResponse = await shopifyTagsAdd(
        region,
        orderGids,
        ['sync_confirmed'],
        {
          queueRunOptions: {
            interval: 100,
          },
        },
      );

      if (!tagResponse?.success) {
        piles.errors.push({
          orderGids,
          tagResponse,
        });
        return false;
      }
      
      piles.tagged.push(...orderGids);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: `tagger:`,
    },
  );

  const processorsFinished = new ThresholdActioner(processors.length, () => {
    tagger.canFinish = true;
  });
  processors.filter(p => p instanceof Processor).forEach(processor => {
    processor.on('done', processorsFinished.increment);
  });

  await Promise.all([
    ...fetchers.map(fetcher => fetcher.run()),
    ...processors.map(processor => processor.run()),
    tagger.run(),
  ]);

  // 4. Check remaining orders individually with WMS

  // 5. Report results with metadata

  console.log(surveyNestedArrays(piles));

  return { 
    success: true,
    result: piles,
  };
  
};

const collabsOrderSyncReviewV3Api = funcApi(collabsOrderSyncReviewV3, {
  argNames: ['region', 'options'],
});

module.exports = {
  collabsOrderSyncReviewV3,
  collabsOrderSyncReviewV3Api,
};

// curl localhost:8000/collabsOrderSyncReviewV3 -H "Content-Type: application/json" -d '{ "region": "us" }'