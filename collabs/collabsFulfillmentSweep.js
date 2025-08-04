const { respond, mandateParam, logDeep, gidToId, askQuestion, dateTimeFromNow, weeks, Processor, ProcessorPipeline } = require('../utils');
const { REGIONS_ALL, REGIONS_PVX, REGIONS_STARSHIPIT } = require('../constants');
const { shopifyRegionToStarshipitAccount } = require('../mappings');

const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');
const { shopifyOrderFulfill } = require('../shopify/shopifyOrderFulfill');

const { peoplevoxOrdersGetById } = require('../peoplevox/peoplevoxOrdersGetById');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');
const { peoplevoxDateFormatter } = require('../peoplevox/peoplevox.utils');
const { peoplevoxDespatchesGetBySalesOrderNumber } = require('../peoplevox/peoplevoxDespatchesGetBySalesOrderNumber');

const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');

const collabsFulfillmentSweep = async (
  {
    shopifyRegions = REGIONS_ALL,
    // TODO: Consider setting based on timeframe
    notifyCustomers = false,
    peoplevoxReportWindowWeeksAgo = 1,
  } = {},
) => {
  
  // 1. Fetch unfulfilled orders for each region
  const getShopifyOrdersPerRegion = (region) => shopifyOrdersGet(
    region,
    {
      attrs: `
        id
        shippingLine {
          title
        }
      `,
      queries: [
        'created_at:>2024-01-01',
        'fulfillment_status:unshipped',
        'status:open',
        'delivery_method:shipping',
      ],
      // limit: 50,
    },
  );

  // 1a. Also prefetch any other useful data, e.g. pvx recent dispatches
  let pvxReportWindowStart = dateTimeFromNow({ minus: weeks(peoplevoxReportWindowWeeksAgo), dateOnly: true });
  pvxReportWindowStart = peoplevoxDateFormatter(pvxReportWindowStart);
  const getPeoplevoxRecentDispatches = () => peoplevoxReportGet('Despatch summary', { 
    columns: ['Salesorder number', 'Carrier', 'Tracking number', 'Despatch date'], 
    searchClause: `([Despatch date] >= ${ pvxReportWindowStart })`, 
  });

  const [
    pvxRecentDispatchesResponse,
    ...shopifyOrderResponses
  ] = await Promise.all([
    getPeoplevoxRecentDispatches(),
    ...shopifyRegions.map(region => getShopifyOrdersPerRegion(region)),
  ]);

  // logDeep(pvxRecentDispatchesResponse);
  // await askQuestion('?');

  // logDeep(shopifyOrderResponses);
  // await askQuestion('?');

  const recentDispatches = pvxRecentDispatchesResponse.result;

  const arrayExhaustedCheck = (arr) => arr.length === 0;

  // piles used: in, continue, resolved
  const recentDispatchProcessorMaker = (piles, processorOptions = {}) => new Processor(
    piles.in,
    async (pile) => {
      const order = pile.shift();
      const { orderId } = order;
      const recentDispatch = recentDispatches.find(dispatch => dispatch['Salesorder number'] === orderId);

      if (recentDispatch && recentDispatch?.['Tracking number']) {

        // console.log(1, recentDispatch);
        // await askQuestion('?');

        const fulfillPayload = {
          originAddress: {
            // Peoplevox, therefore AU
            countryCode: 'AU',
          },
          trackingInfo: {
            number: recentDispatch['Tracking number'],
          },
        };

        piles.resolved.push({
          ...order,
          // tracking: recentDispatch,
          fulfillPayload,
        });
        return;
      }

      piles.continue.push(order);
    },
    arrayExhaustedCheck, // pileExhaustedCheck
    processorOptions,
  );

  // piles used: in, continue, resolved
  const peoplevoxProcessorMaker = (piles, processorOptions = {}) => new Processor(
    piles.in,
    async (pile) => {
      const orders = pile.splice(0, 100);
      const orderIds = orders.map(o => o.orderId);
      const peoplevoxDispatchesResponse = await peoplevoxDespatchesGetBySalesOrderNumber(orderIds);
      // console.log(peoplevoxDispatches);
      // await askQuestion('?');

      if (!peoplevoxDispatchesResponse?.success) {
        piles.continue.push(...orders);
        return;
      }

      const peoplevoxDispatches = peoplevoxDispatchesResponse.result;
      for (const order of orders) {
        const peoplevoxDispatch = peoplevoxDispatches.find(dispatch => dispatch['Salesorder number'] === order.orderId);

        if (peoplevoxDispatch && peoplevoxDispatch['Tracking number']) {

          // console.log(2, peoplevoxDispatch);
          // await askQuestion('?');

          const fulfillPayload = {
            originAddress: {
              // Peoplevox, therefore AU
              countryCode: 'AU',
            },
            trackingInfo: {
              number: peoplevoxDispatch['Tracking number'],
            },
          };

          piles.resolved.push({
            ...order,
            // tracking: peoplevoxDispatch,
            fulfillPayload,
          });
          continue;
        }

        piles.continue.push(order);
      }
    },
    arrayExhaustedCheck, // pileExhaustedCheck
    processorOptions,
  );

  // piles used: in, continue, resolved, disqualified
  const starshipitProcessorMaker = (piles, region, processorOptions = {}) => new Processor(
    piles.in,
    async (pile) => {
      const order = pile.shift();
      const { orderId, shippingLine } = order;
      const shippingMethod = shippingLine?.title;
      const starshipitAccount = shopifyRegionToStarshipitAccount(region, shippingMethod);
      const starshipitOrderResponse = await starshipitOrderGet(starshipitAccount, { orderNumber: orderId });

      if (!starshipitOrderResponse?.success || !starshipitOrderResponse?.result) {
        piles.continue.push(order);
        return;
      }

      const starshipitOrder = starshipitOrderResponse.result;
      const { 
        status,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
      } = starshipitOrder || {};
      
      // TODO: Consider using 'manifested'
      if (
        starshipitOrder 
        && status
      ) {

        if (['Unshipped', 'Printed', 'Saved'].includes(status)) {
          piles.disqualified.push(order);
          return;
        }

        // console.log(3, starshipitOrder);
        // await askQuestion('?');

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

        piles.resolved.push({
          ...order,
          // tracking: starshipitOrder,
          fulfillPayload,
        });
        return;
      }

      piles.continue.push(order);
    },
    arrayExhaustedCheck, // pileExhaustedCheck
    processorOptions,
  );
  
  // piles used: in, resolved, error
  const fulfillingProcessorMaker = (piles, region, processorOptions = {}) => new Processor(
    piles.in,
    async (pile) => {
      const order = pile.shift();
      const { orderId, fulfillPayload } = order;

      if (!fulfillPayload) {
        throw new Error('Nothing should be coming through here without a fulfillPayload');
      }

      const fulfillResponse = await shopifyOrderFulfill(
        region, 
        orderId, 
        {
          notifyCustomer: notifyCustomers,
          ...fulfillPayload,
        },
      );
      // logDeep(fulfillResponse);
      // await askQuestion('?');

      if (!fulfillResponse?.success) {
        piles.error.push({
          ...order,
          fulfillResponse,
        });
        return;
      }

      piles.resolved.push({
        ...order,
        fulfillResponse,
      });
    },
    arrayExhaustedCheck, // pileExhaustedCheck
    processorOptions,
  );

  const pilesByRegion = {};

  // TODO: Implement dynamic pipeline using REGIONS_ constants to decide where to get info from, and using an array of piles to form the pipeline.

  // 2. For each region, deplete array of unfulfilled orders by retrieving tracking info from other platforms specific to that region
  for (const [i, region] of shopifyRegions.entries()) {
    const shopifyOrderReponse = shopifyOrderResponses[i];

    const { success, result } = shopifyOrderReponse;
    if (!success) {
      return shopifyOrderReponse;
    }

    const shopifyOrders = result;
    const inputPile = shopifyOrders.map(o => {
      const { id: orderGid } = o;
      const orderId = gidToId(orderGid);
      return {
        ...o,
        orderId,
      };
    });

    console.log(region, inputPile.length);

    const piles = {
      readyToFulfill: [],
      fulfilled: [],
      notShipped: [],
      error: [],
    };

    const pipeline = new ProcessorPipeline();

    // Add PVX processors if region supports it
    if (REGIONS_PVX.includes(region)) {
      pipeline.add({
        maker: recentDispatchProcessorMaker,
        piles: { 
          // During a ProcessorPipeline, in: and continue: are dynamic
          resolved: piles.readyToFulfill,
        },
        makerOptions: { logFlavourText: `${ region }:1:` },
      });

      pipeline.add({
        maker: peoplevoxProcessorMaker,
        piles: { 
          resolved: piles.readyToFulfill,
        },
        makerOptions: { logFlavourText: `${ region }:2:` },
      });
    }

    // Add Starshipit processor if region supports it
    if (REGIONS_STARSHIPIT.includes(region)) {
      pipeline.add({
        maker: starshipitProcessorMaker,
        piles: { 
          resolved: piles.readyToFulfill,
          disqualified: piles.notShipped,
        },
        makerArgs: [region],
        makerOptions: { logFlavourText: `${ region }:3:` },
      });
    }

    if (!pipeline.length()) {
      console.warn('No processors added for region', region);
      pilesByRegion[region] = piles;
      continue;
    }

    // Add fulfillment processor
    pipeline.add({
      maker: fulfillingProcessorMaker,
      piles: { 
        in: piles.readyToFulfill, // override the dynamic pile and explicitly use the pile that resolved orders have been going into
        resolved: piles.fulfilled,
        error: piles.error,
      },
      makerArgs: [region],
      makerOptions: { logFlavourText: `${ region }:4:` },
    });

    await pipeline.run(inputPile);

    logDeep(region, piles);
    pilesByRegion[region] = piles;
  }

  return {
    success: true,
    result: pilesByRegion,
  };
};

const collabsFulfillmentSweepApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await collabsFulfillmentSweep(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsFulfillmentSweep,
  collabsFulfillmentSweepApi,
};

// curl localhost:8000/collabsFulfillmentSweep
// curl localhost:8000/collabsFulfillmentSweep -H "Content-Type: application/json" -d '{ "options": { "shopifyRegions": ["au"], "notifyCustomers": false } }'