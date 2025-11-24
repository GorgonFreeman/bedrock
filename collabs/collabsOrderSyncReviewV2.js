const { funcApi, logDeep, dateTimeFromNow, days, askQuestion } = require('../utils');
const { 
  HOSTED,
  REGIONS_PVX, 
  REGIONS_BLECKMANN,
  REGIONS_LOGIWA,
} = require('../constants');

const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');

const { bleckmannPickticketsGet, bleckmannPickticketsGetter } = require('../bleckmann/bleckmannPickticketsGet');

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
    found: [],
    missing: [],
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

  let getterWms;

  if (bleckmannRelevant) {
    await bleckmannPickticketsGet({
      createdFrom: `${ dateTimeFromNow({ minus: days(5), dateOnly: true }) }T00.00.00Z`,
    });

    await askQuestion('?');

    getterWms = await bleckmannPickticketsGetter({
      createdFrom: `${ dateTimeFromNow({ minus: days(5), dateOnly: true }) }T00:00:00Z`,

      onItems: (items) => {
        piles.wms.push(...items);
      },

      logFlavourText: `wms:getter:`,
    });

    await askQuestion('?');
  }

  getters.push(getterWms);

  await Promise.all(getters.map(getter => getter.run()));

  logDeep(piles);

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