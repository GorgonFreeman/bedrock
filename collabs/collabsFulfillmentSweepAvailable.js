// Actions the fulfillments that are easiest to get from the WMS

const { funcApi, logDeep, surveyNestedArrays, dateTimeFromNow, days, Processor, askQuestion, ThresholdActioner, Getter, wait, gidToId } = require('../utils');

const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');
const { bleckmannPickticketsGetter } = require('../bleckmann/bleckmannPickticketsGet');

const collabsFulfillmentSweepAvailable = async (
  region,
  {
    option,
  } = {},
) => {

  const pvxRelevant = REGIONS_PVX.includes(region);
  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  const bleckmannRelevant = REGIONS_BLECKMANN.includes(region);
  const anyRelevant = [
    // pvxRelevant, 
    // logiwaRelevant, 
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
    fulfillable: [],
  };

  const getters = [];

  const getterShopify = await shopifyOrdersGetter(
    region, 
    {
      attrs: `
        id
        name
        shippingLine {
          title
        }
      `,
      queries: [
        'created_at:>2025-10-01',
        // 'created_at:<2025-10-01',
        'fulfillment_status:unshipped',
        'status:open',
        'delivery_method:shipping',
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
  
  let wmsGetters = [];
  let eagerProcessor;

  if (bleckmannRelevant) {
    const shippedPickticketsGetter = await bleckmannPickticketsGetter(
      {
        createdFrom: `${ dateTimeFromNow({ minus: days(5), dateOnly: true }) }T00:00:00Z`,
        status: 'SHIPPED',

        onItems: (items) => {
          piles.wms.push(...items);
        },

        logFlavourText: `bleckmann:getter:`,
      },
    );

    wmsGetters.push(shippedPickticketsGetter);

    eagerProcessor = new Processor(
      piles.wms,
      async (pile) => {

        if (!eagerProcessor.canFinish) {
          await wait(1);
        }

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
        piles.fulfillable.push({
          shopifyOrder,
          bleckmannPickticket: pickticket,
        });

        logDeep(piles.fulfillable);
      },
      pile => pile.length === 0,
      {
        canFinish: false,
        logFlavourText: `bleckmann:eager:`,
        runOptions: {
          verbose: false,
        },
      },
    );
  }

  getters.push(...wmsGetters);

  const gettersFinishedActioner = new ThresholdActioner(getters.length, () => {
    eagerProcessor.canFinish = true;
  });
  getters.filter(g => g instanceof Getter).forEach(getter => {
    getter.on('done', gettersFinishedActioner.increment);
  });

  await Promise.all([
    ...getters.map(getter => getter.run()),
    eagerProcessor.run(),
  ]);

  logDeep(surveyNestedArrays(piles));

  return { 
    region, 
    option,
  };
  
};

const collabsFulfillmentSweepAvailableApi = funcApi(collabsFulfillmentSweepAvailable, {
  argNames: ['region', 'options'],
});

module.exports = {
  collabsFulfillmentSweepAvailable,
  collabsFulfillmentSweepAvailableApi,
};

// curl localhost:8000/collabsFulfillmentSweepAvailable -H "Content-Type: application/json" -d '{ "region": "uk" }'