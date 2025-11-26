const { funcApi, logDeep, dateTimeFromNow, days, askQuestion, Processor, Getter, ThresholdActioner, gidToId, wait, surveyNestedArrays } = require('../utils');
const { 
  HOSTED,
  REGIONS_PVX, 
  REGIONS_BLECKMANN,
  REGIONS_LOGIWA,
} = require('../constants');

const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');
const { shopifyTagsAdd } = require('../shopify/shopifyTagsAdd');

const { bleckmannPickticketsGetter } = require('../bleckmann/bleckmannPickticketsGet');
const { bleckmannPickticketGet } = require('../bleckmann/bleckmannPickticketGet');

const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');
const { peoplevoxOrdersGetById } = require('../peoplevox/peoplevoxOrdersGetById');

const { logiwaStatusToStatusId } = require('../logiwa/logiwa.utils');
const { logiwaOrdersGetter } = require('../logiwa/logiwaOrdersGet');
const { logiwaOrderGet } = require('../logiwa/logiwaOrderGet');

const collabsOrderSyncReviewV2 = async (
  region,
  {
    option,
  } = {},
) => {

  const pvxRelevant = REGIONS_PVX.includes(region);
  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  const bleckmannRelevant = REGIONS_BLECKMANN.includes(region);
  const anyRelevant = [
    pvxRelevant, 
    logiwaRelevant, 
    bleckmannRelevant,
  ].some(Boolean);
  
  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }

  const piles = {
    shopify: [],
    wms: [],
    discarded: [],
    found: [],
    missing: [],
    errors: [],
    results: [],
  };

  const shopifyQueriesByRegion = {
    au: [
      `tag_not:'Sync:Confirmed'`,
    ],
    us: [
      `tag:'sync-to-radial'`,
    ],
  };

  const getters = [];

  const getterShopify = await shopifyOrdersGetter(
    region, 
    {
      attrs: `
        id
        name
        createdAt
      `,
      queries: [
        'created_at:>2025-07-01',
        'fulfillment_status:unshipped OR fulfillment_status:partial',
        'status:open',
        'delivery_method:shipping',
        `tag_not:'order_sync_review_exclude'`,
        `tag_not:'sync_confirmed'`,
        ...(shopifyQueriesByRegion?.[region] || []),
      ],
      sortKey: 'CREATED_AT',
      reverse: true,

      onItems: (items) => {
        piles.shopify.push(...items);
      },

      logFlavourText: `shopify:getter:`,
    },
  );

  getters.push(getterShopify);

  let getterWms; // getter that fetches orders from the WMS in bulk
  let eagerProcessor; // processor that checks the fetched orders for both Shopify and the WMS and resolves any that can be resolved
  let thoroughProcessor; // processor that goes through the remaining unresolved Shopify orders and attempts to fetch orders from the WMS individually

  if (bleckmannRelevant) {

    getterWms = await bleckmannPickticketsGetter({
      createdFrom: `${ dateTimeFromNow({ minus: days(5), dateOnly: true }) }T00:00:00Z`,

      onItems: (items) => {
        piles.wms.push(...items);
      },

      logFlavourText: `wms:getter:`,
    });

    eagerProcessor = new Processor(
      piles.wms,
      // TODO: Consider pushing orders to another pile while eager, and only pushing back to the original pile when exhausted.
      async (pile) => {
  
        // Make the operation async so that getters can continue
        if (!eagerProcessor.canFinish) {
          await wait(1);
        }
  
        // Attempt to find orders in already fetched Shopify orders. If not found, push to the front of the array.
        const pickticket = pile.shift();
  
        const fail = () => {
          piles[eagerProcessor.canFinish ? 'discarded' : 'wms'].push(pickticket);
        };
  
        const { reference } = pickticket;
        const shopifyOrder = piles.shopify.find(order => gidToId(order.id) === reference);
  
        if (!shopifyOrder) {
          fail();
          return;
        }
        
        const orderIndex = piles.shopify.indexOf(shopifyOrder);
        // This shouldn't happen, we just found the order in the array
        if (orderIndex === -1) {
          fail();
          return;
        }
        // Remove order from Shopify pile
        piles.shopify.splice(orderIndex, 1);
        piles.found.push(shopifyOrder);
      },
      pile => pile.length === 0,
      {
        canFinish: false,
        logFlavourText: `eager:`,
        // runOptions: {
        //   verbose: false,
        // },
      },
    );

    thoroughProcessor = new Processor(
      piles.shopify,
      async (pile) => {
  
        const order = pile.shift();
        const { id: orderGid } = order;
        const orderId = gidToId(orderGid);
  
        const pickticketResponse = await bleckmannPickticketGet({ pickticketReference: orderId });
  
        const { success, result: pickticket } = pickticketResponse;
        if (!success) {
          piles.errors.push({
            ...order,
            pickticketResponse,
          });
          return;
        }
  
        if (!pickticket) {
          piles.missing.push(order);
          return;
        }
  
        piles.found.push(order);
      },
      pile => pile.length === 0,
      {
        canFinish: true,
        logFlavourText: `thorough:`,
      },
    );
  }

  if (pvxRelevant) {
    getterWms = async (callback) => {
      const peoplevoxReportResponse = await peoplevoxReportGet('Orders Last 2 Days');
      const { success: peoplevoxReportSuccess, result: pvxReportOrders } = peoplevoxReportResponse;

      if (!peoplevoxReportSuccess) {
        logDeep(peoplevoxReportResponse);
        throw new Error('Failed to get Peoplevox orders');
      }

      piles.wms.push(...pvxReportOrders);
      callback();
    };

    eagerProcessor = new Processor(
      piles.wms,
      async (pile) => {
  
        // Make the operation async so that getters can continue
        if (!eagerProcessor.canFinish) {
          await wait(1);
        }
  
        // Attempt to find orders in already fetched Shopify orders. If not found, push to the front of the array.
        const peoplevoxOrder = pile.shift();
  
        const fail = () => {
          piles[eagerProcessor.canFinish ? 'discarded' : 'wms'].push(peoplevoxOrder);
        };
  
        const { 'Sales order no.': salesOrderNumber } = peoplevoxOrder;
        const shopifyOrder = piles.shopify.find(order => gidToId(order.id) === salesOrderNumber);

        if (!shopifyOrder) {
          fail();
          return;
        }
        
        const orderIndex = piles.shopify.indexOf(shopifyOrder);
        // This shouldn't happen, we just found the order in the array
        if (orderIndex === -1) {
          fail();
          return;
        }
        // Remove order from Shopify pile
        piles.shopify.splice(orderIndex, 1);
        piles.found.push(shopifyOrder);
      },
      pile => pile.length === 0,
      {
        canFinish: false,
        logFlavourText: `eager:`,
        runOptions: {
          verbose: false,
        },
      },
    );

    thoroughProcessor = new Processor(
      piles.shopify,
      async (pile) => {

        const orders = pile.splice(0);
        const peoplevoxOrdersResponse = await peoplevoxOrdersGetById(orders.map(o => gidToId(o.id)));

        const { success: peoplevoxOrdersSuccess, result: peoplevoxOrders } = peoplevoxOrdersResponse;
        if (!peoplevoxOrdersSuccess) {
          piles.errors.push(...orders);
          return;
        }

        const peoplevoxOrderIds = new Set(peoplevoxOrders.map(o => o.SalesOrderNumber));

        for (const order of orders) {
          const { id: orderGid } = order;
          const orderId = gidToId(orderGid);

          if (peoplevoxOrderIds.has(orderId)) {
            piles.found.push(order);
            continue;
          }
          
          piles.missing.push(order);
        }
      },
      pile => pile.length === 0,
      {
        canFinish: true,
        logFlavourText: `thorough:`,
      },
    );
  }

  if (logiwaRelevant) {
    getterWms = await logiwaOrdersGetter({
      status_eq: logiwaStatusToStatusId('Open'),

      onItems: (items) => {
        piles.wms.push(...items);
      },

      logFlavourText: `wms:getter:`,
    });

    eagerProcessor = new Processor(
      piles.wms,
      async (pile) => {

        // Make the operation async so that getters can continue
        if (!eagerProcessor.canFinish) {
          await wait(1);
        }

        const logiwaOrder = pile.shift();

        const fail = () => {
          piles[eagerProcessor.canFinish ? 'discarded' : 'wms'].push(logiwaOrder);
        };

        const { code } = logiwaOrder;
        const shopifyOrder = piles.shopify.find(order => order.name === code);
  
        if (!shopifyOrder) {
          fail();
          return;
        }
        
        const orderIndex = piles.shopify.indexOf(shopifyOrder);
        // This shouldn't happen, we just found the order in the array
        if (orderIndex === -1) {
          fail();
          return;
        }
        // Remove order from Shopify pile
        piles.shopify.splice(orderIndex, 1);
        piles.found.push(shopifyOrder);
      },
      pile => pile.length === 0,
      {
        canFinish: false,
        logFlavourText: `eager:`,
      },
    );

    thoroughProcessor = new Processor(
      piles.shopify,
      async (pile) => {
        const order = pile.shift();
        const { name } = order;

        const logiwaOrderResponse = await logiwaOrderGet({ orderCode: name });

        const { success: logiwaOrderSuccess, result: logiwaOrder } = logiwaOrderResponse;
        if (!logiwaOrderSuccess) {
          piles.errors.push(order);
          return;
        }
        
        if (!logiwaOrder) {
          piles.missing.push(order);
          return;
        }

        piles.found.push(order);
      },
      pile => pile.length === 0,
      {
        canFinish: true,
        logFlavourText: `thorough:`,
        runOptions: {
          interval: 100,
        },
        maxInFlightRequests: 50,
      },
    );
  }

  getters.push(getterWms);

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
            interval: 20,
          },
        },
      );

      piles.results.push(tagResponse);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: `tagger:`,
    },
  );

  const gettersFinishedActioner = new ThresholdActioner(getters.length, () => {
    eagerProcessor.canFinish = true;
  });
  getters.filter(g => g instanceof Getter).forEach(getter => {
    getter.on('done', gettersFinishedActioner.increment);
  });
  
  await Promise.all([
    ...getters.map(getter => typeof getter.run === 'function' ? getter?.run() : getter(gettersFinishedActioner.increment)),
    typeof eagerProcessor.run === 'function' ? eagerProcessor?.run() : eagerProcessor(),
  ]);

  if (thoroughProcessor) {
    thoroughProcessor.on('done', () => {
      tagger.canFinish = true;
    });
  } else {
    tagger.canFinish = true;
  }

  await Promise.all([
    tagger.run(),
    ...thoroughProcessor ? [thoroughProcessor?.run() || thoroughProcessor()] : [],
  ]);

  logDeep(piles);
  logDeep(surveyNestedArrays(piles));

  return { 
    region, 
    option,
  };
  
};

const collabsOrderSyncReviewV2Api = funcApi(collabsOrderSyncReviewV2, {
  argNames: ['region', 'options'],
});

module.exports = {
  collabsOrderSyncReviewV2,
  collabsOrderSyncReviewV2Api,
};

// curl localhost:8000/collabsOrderSyncReviewV2 -H "Content-Type: application/json" -d '{ "region": "uk" }'