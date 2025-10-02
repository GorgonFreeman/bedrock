const { 
  REGIONS_ALL, 
  REGIONS_PVX, 
  REGIONS_LOGIWA, 
  REGIONS_BLECKMANN, 
  REGIONS_STARSHIPIT,
} = require('../constants');
const { shopifyRegionToStarshipitAccount } = require('../mappings');
const { funcApi, logDeep, Processor, arrayExhaustedCheck, askQuestion, gidToId } = require('../utils');
const { shopifyOrdersGetter } = require('../shopify/shopifyOrdersGet');
const { shopifyOrderFulfill } = require('../shopify/shopifyOrderFulfill');
const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');

const collabsFulfillmentSweepV3 = async (
  {
    regions = REGIONS_ALL,
    // option,
  } = {},
) => {

  // const regionsPeoplevox = regions.filter(region => REGIONS_PVX.includes(region));
  // const regionsLogiwa = regions.filter(region => REGIONS_LOGIWA.includes(region));
  // const regionsBleckmann = regions.filter(region => REGIONS_BLECKMANN.includes(region));
  const regionsStarshipit = regions.filter(region => REGIONS_STARSHIPIT.includes(region));

  const anyRelevant = [
    // regionsPeoplevox, 
    // regionsLogiwa, 
    // regionsBleckmann, 
    regionsStarshipit,
  ].some(r => r?.length);

  if (!anyRelevant) {
    return {
      success: false,
      message: ['No regions supported'],
    };
  }

  const unsupportedRegions = regions.filter(region => ![
    // regionsPeoplevox, 
    // regionsLogiwa, 
    // regionsBleckmann, 
    regionsStarshipit,
  ].some(r => r.includes(region)));
  if (unsupportedRegions.length > 0) {
    return {
      success: false,
      message: [`Unsupported regions: ${ unsupportedRegions.join(', ') }`],
    };
  }

  const piles = {
    shopifyOrderFulfill: [],
  };

  for (const region of regions) {
    piles[region] = {
      in: [],
      resolved: [],
      disqualified: [],
      error: [],
    };
  }

  const getters = [];
  const processors = [];
  const fulfillers = [];

  let gettersFinished = 0;
  const getterFinish = () => {
    gettersFinished++;
    if (gettersFinished === getters.length) {
      processors.forEach(i => i.canFinish = true);
    }
  };

  let processorsFinished = 0;
  const processorFinish = () => {
    processorsFinished++;
    if (processorsFinished === processors.length) {
      fulfillers.forEach(i => i.canFinish = true);
    }
  };
  
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
        sortKey: 'CREATED_AT',
        reverse: true,

        onItems: (items) => {
          piles[region].in.push(...items);
        },

        onDone: getterFinish,

        limit: 50,
      },
    );

    getters.push(getter);
  }

  for (const region of regionsStarshipit) {

    const starshipitProcessor = new Processor(
      piles[region].in,
      async (pile) => {

        const order = pile.shift();
        const { id: orderGid, shippingLine } = order;
        const orderId = gidToId(orderGid);
        const shippingMethod = shippingLine?.title;
        const starshipitAccount = shopifyRegionToStarshipitAccount(region, shippingMethod);

        if (!starshipitAccount) {
          console.warn(`No Starshipit account found for ${ region }:${ shippingMethod } (${ orderId })`);
          piles[region].error.push({
            ...order,
            reason: `No Starshipit account found for ${ region }:${ shippingMethod }`,
          });
          return;
        }

        const starshipitOrderResponse = await starshipitOrderGet(starshipitAccount, { orderNumber: orderId });
        const { success, result: starshipitOrder } = starshipitOrderResponse;
        if (!success || !starshipitOrder) {
          piles[region].error.push({
            ...order,
            reason: 'Failed to retrieve order from Starshipit',
          });
          return;
        }

        const { 
          status,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
        } = starshipitOrder;

        // TODO: Consider using 'manifest_sent'
        if (!trackingNumber) {
          piles[region].disqualified.push({
            ...order,
            reason: 'No tracking number available',
          });
          return;
        }

        if (['Unshipped', 'Printed', 'Saved'].includes(status)) {
          piles[region].disqualified.push({
            ...order,
            reason: `Status '${ status }' not shipped`,
          });
          return;
        }

        if (!['Shipped'].includes(status)) {
          console.warn(`Unrecognised Starshipit status: ${ status } (${ orderId })`);
          piles[region].error.push({
            ...order,
            reason: `Unrecognised Starshipit status: ${ status }`,
          });
          return;
        }

        const fulfillPayload = {
          originAddress: {
            // Starshipit, therefore AU
            countryCode: 'AU',
          },
          trackingInfo: {
            number: trackingNumber,
            url: trackingUrl,
          },
        };

        // Push fulfillment into to a pile to be fulfilled
        piles.shopifyOrderFulfill.push([
          region,
          { orderId },
          {
            notifyCustomer: false, // TODO: Consider setting to true if recent order
            ...fulfillPayload,
          },
        ]);

      },
      arrayExhaustedCheck,
      {
        canFinish: false,
        onDone: processorFinish,
      },
    );

    processors.push(starshipitProcessor);
  }

  const orderFulfiller = new Processor(
    piles.shopifyOrderFulfill,
    async (pile) => {
      const args = pile.shift();
      const [region, ...rest] = args;
      const response = await shopifyOrderFulfill(...args);
      const destination = response?.success ? 'resolved' : 'error';
      piles[region][destination].push(response);
    },
    arrayExhaustedCheck,
    {
      canFinish: false,
    },
  );

  fulfillers.push(orderFulfiller);

  await Promise.all([
    ...getters.map(getter => getter.run()),
    ...processors.map(processor => processor.run()),
    ...fulfillers.map(fulfiller => fulfiller.run()),
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