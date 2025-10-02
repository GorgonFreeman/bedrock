const { 
  REGIONS_ALL, 
  REGIONS_PVX, 
  REGIONS_LOGIWA, 
  REGIONS_BLECKMANN, 
  REGIONS_STARSHIPIT,
} = require('../constants');
const { shopifyRegionToStarshipitAccount } = require('../mappings');
const { funcApi, logDeep, Processor, arrayExhaustedCheck } = require('../utils');
const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');
const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');

const collabsFulfillmentSweepV3 = async (
  {
    regions = REGIONS_ALL,
    // option,
  } = {},
) => {

  const regionsPeoplevox = regions.filter(region => REGIONS_PVX.includes(region));
  const regionsLogiwa = regions.filter(region => REGIONS_LOGIWA.includes(region));
  const regionsBleckmann = regions.filter(region => REGIONS_BLECKMANN.includes(region));
  const regionsStarshipit = regions.filter(region => REGIONS_STARSHIPIT.includes(region));

  const piles = {};

  for (const region of regions) {
    piles[region] = {
      in: [],
      resolved: [],
      disqualified: [],
      error: [],
    };
  }
  
  const shopifyOrderGetters = [];
  for (const region of regions) {

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
          piles[region].in.push(...items);
        },
      },
    );

    shopifyOrderGetters.push(getter);
  }

  const processors = [];

  for (const region of regionsStarshipit) {

    const starshipitProcessor = new Processor(
      piles[region].in,
      async (pile) => {

        const order = pile.shift();
        const { orderId, shippingLine } = order;
        const shippingMethod = shippingLine?.title;
        const starshipitAccount = shopifyRegionToStarshipitAccount(region, shippingMethod);

        const starshipitOrderResponse = await starshipitOrderGet(starshipitAccount, { orderNumber: orderId });
        const { success, result: starshipitOrder } = starshipitOrderResponse;
        if (!success || !starshipitOrder) {
          piles[region].error.push(order);
          return;
        }

        const { 
          status,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
        } = starshipitOrder;
        
        if (status === 'Shipped') {

          // Push fulfillment into to a pile to be fulfilled
          piles[region].resolved.push(order);
          return;

        } else {
          piles[region].disqualified.push(order);
        }
      },
      arrayExhaustedCheck,
      {
        canFinish: false,
      },
    );

    processors.push(starshipitProcessor);
  }

  await Promise.all([
    ...shopifyOrderGetters.map(getter => getter.run()),
    ...processors.map(processor => processor.run()),
  ]);

  logDeep(piles);

  return { 
    success: true,
    result: piles, 
  };
  
};

const collabsFulfillmentSweepV3Api = funcApi(collabsFulfillmentSweepV3);

module.exports = {
  collabsFulfillmentSweepV3,
  collabsFulfillmentSweepV3Api,
};

// curl localhost:8000/collabsFulfillmentSweepV3 -H "Content-Type: application/json" -d '{ "regions": ["au"] }'