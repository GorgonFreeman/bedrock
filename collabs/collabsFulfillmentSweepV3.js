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
const { peoplevoxDespatchesGetBySalesOrderNumber } = require('../peoplevox/peoplevoxDespatchesGetBySalesOrderNumber');

const collabsFulfillmentSweepV3 = async (
  {
    regions = REGIONS_ALL,
    // option,
  } = {},
) => {

  const regionsPeoplevox = regions.filter(region => REGIONS_PVX.includes(region));
  // const regionsLogiwa = regions.filter(region => REGIONS_LOGIWA.includes(region));
  // const regionsBleckmann = regions.filter(region => REGIONS_BLECKMANN.includes(region));
  const regionsStarshipit = regions.filter(region => REGIONS_STARSHIPIT.includes(region));

  const anyRelevant = [
    regionsPeoplevox, 
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
    regionsPeoplevox, 
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
          // 'created_at:<2025-10-01',
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

        logFlavourText: `${ region }:getter:`,
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
          packages,
          manifested,
        } = starshipitOrder;

        if (!manifested) {
          piles[region].disqualified.push({
            ...order,
            reason: `Not manifested`,
          });
          return;
        }

        const package = packages?.[0];

        if (!package) {
          piles[region].disqualified.push({
            ...order,
            reason: 'No Starshipit package',
          });
          return;
        }

        const {
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
        } = package;

        if (!trackingNumber) {
          piles[region].disqualified.push({
            ...order,
            reason: 'No tracking number available',
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
        logFlavourText: `${ region }:starshipit:`,
      },
    );

    processors.push(starshipitProcessor);
  }

  for (const region of regionsPeoplevox) {

    const peoplevoxProcessor = new Processor(
      piles[region].in,
      async (pile) => {

        const orders = pile.splice(0, 100);
        const orderIds = orders.map(o => gidToId(o.id));
        const peoplevoxDispatchesResponse = await peoplevoxDespatchesGetBySalesOrderNumber(orderIds);

        if (!peoplevoxDispatchesResponse?.success) {
          piles[region].error.push(...orders);
          return;
        }

        const peoplevoxDispatches = peoplevoxDispatchesResponse.result;
        for (const order of orders) {

          const peoplevoxDispatch = peoplevoxDispatches?.find(dispatch => dispatch['Salesorder number'] === order.orderId);

          if (!peoplevoxDispatch) {
            piles[region].error.push({
              ...order,
              reason: 'No Peoplevox dispatch found',
            });
            return;
          }

          const {
            'Tracking number': trackingNumber,
          } = peoplevoxDispatch;

          if (!trackingNumber) {
            piles[region].disqualified.push({
              ...order,
              reason: 'No tracking number available',
            });
            return;
          }

          if (peoplevoxDispatch && trackingNumber) {

            const fulfillPayload = {
              originAddress: {
                // Peoplevox, therefore AU
                countryCode: 'AU',
              },
              trackingInfo: {
                number: trackingNumber,
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
          }
        }
      },
      arrayExhaustedCheck,
      {
        canFinish: false,
        onDone: processorFinish,
        logFlavourText: `${ region }:peoplevox:`,
      },
    );

    processors.push(peoplevoxProcessor);
  }

  const orderFulfiller = new Processor(
    piles.shopifyOrderFulfill,
    async (pile) => {
      const args = pile.shift();

      logDeep('fulfill', args);
      // await askQuestion('?');

      const [region, ...rest] = args;
      const response = await shopifyOrderFulfill(...args);
      const destination = response?.success ? 'resolved' : 'error';
      piles[region][destination].push(response);
    },
    arrayExhaustedCheck,
    {
      canFinish: false,
      logFlavourText: `fulfiller:`,
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

const collabsFulfillmentSweepV3Api = funcApi(
  collabsFulfillmentSweepV3,
  {
    argNames: ['options'],
  },
);

module.exports = {
  collabsFulfillmentSweepV3,
  collabsFulfillmentSweepV3Api,
};

// curl localhost:8000/collabsFulfillmentSweepV3 -H "Content-Type: application/json" -d '{ "options": { "regions": ["au", "baddest"] } }'