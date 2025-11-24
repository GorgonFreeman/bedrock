const { funcApi, logDeep } = require('../utils');

const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');

const collabsOrderSyncReviewV2 = async (
  region,
  {
    option,
  } = {},
) => {

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