const { REGIONS_ALL } = require('../constants');
const { funcApi } = require('../utils');
const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');

const collabsFulfillmentSweepV3 = async (
  {
    regions = REGIONS_ALL,
    // option,
  } = {},
) => {

  const piles = {
    in: {},
  };
  
  const shopifyOrderGetters = [];
  for (const region of regions) {
    piles.in[region] = [];

    const getter = await shopifyOrdersGetter(
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
          'created_at:>2025-07-01',
          'fulfillment_status:unshipped',
          'status:open',
          'delivery_method:shipping',
        ],

        onItems: (items) => {
          piles.in[region].push(...items);
        },
      },
    );

    shopifyOrderGetters.push(getter);
  }

  await Promise.all(shopifyOrderGetters.map(getter => getter.run()));

  return { 
    regions, 
    // option,
  };
  
};

const collabsFulfillmentSweepV3Api = funcApi(collabsFulfillmentSweepV3);

module.exports = {
  collabsFulfillmentSweepV3,
  collabsFulfillmentSweepV3Api,
};

// curl localhost:8000/collabsFulfillmentSweepV3 -H "Content-Type: application/json" -d '{ "regions": ["au"] }'