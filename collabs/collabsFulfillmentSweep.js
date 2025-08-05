const { respond, mandateParam, logDeep, gidToId, askQuestion, dateTimeFromNow, weeks, Processor, ProcessorPipeline } = require('../utils');
const { 
  REGIONS_ALL, 
  REGIONS_PVX, 
  REGIONS_STARSHIPIT,
  REGIONS_LOGIWA,
  STARSHIPIT_ACCOUNT_HANDLES,
} = require('../constants');
const { shopifyRegionToStarshipitAccount } = require('../mappings');

const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');
const { shopifyOrderFulfill } = require('../shopify/shopifyOrderFulfill');

const { peoplevoxOrdersGetById } = require('../peoplevox/peoplevoxOrdersGetById');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');
const { peoplevoxDateFormatter } = require('../peoplevox/peoplevox.utils');
const { peoplevoxDespatchesGetBySalesOrderNumber } = require('../peoplevox/peoplevoxDespatchesGetBySalesOrderNumber');

const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');
const { starshipitOrdersListShipped } = require('../starshipit/starshipitOrdersListShipped');

const { logiwaOrderGet } = require('../logiwa/logiwaOrderGet');

// TODO: Implement more mass ways of getting orders out of Starshipit

const collabsFulfillmentSweep = async (
  {
    shopifyRegions = REGIONS_ALL,
    // TODO: Consider setting based on timeframe or status
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
        name
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
  const peoplevoxRelevant = shopifyRegions.some(region => REGIONS_PVX.includes(region));

  let pvxReportWindowStart = dateTimeFromNow({ minus: weeks(peoplevoxReportWindowWeeksAgo), dateOnly: true });
  pvxReportWindowStart = peoplevoxDateFormatter(pvxReportWindowStart);
  const getPeoplevoxRecentDispatches = async () => {
    const peoplevoxRecentDispatchesResponse = await peoplevoxReportGet('Despatch summary', { 
      columns: ['Salesorder number', 'Carrier', 'Tracking number', 'Despatch date'], 
      searchClause: `([Despatch date] >= ${ pvxReportWindowStart })`, 
    });

    if (!peoplevoxRecentDispatchesResponse?.success || !peoplevoxRecentDispatchesResponse?.result) {
      return;
    }

    return peoplevoxRecentDispatchesResponse.result;
  };

  // 1b. Prefetch Starshipit shipped orders
  const starshipitRelevant = shopifyRegions.some(region => REGIONS_STARSHIPIT.includes(region));

  const getStarshipitShippedOrders = async () => {
    const starshipitShippedOrdersByAccount = {};

    await Promise.all(STARSHIPIT_ACCOUNT_HANDLES.map(async acc => {
      const starshipitShippedOrdersResponse = await starshipitOrdersListShipped(
        acc,
      );

      if (!starshipitShippedOrdersResponse?.success || !starshipitShippedOrdersResponse?.result) {
        return;
      }

      starshipitShippedOrdersByAccount[acc] = starshipitShippedOrdersResponse.result;
    }));

    return starshipitShippedOrdersByAccount;
  };

  const [
    pvxRecentDispatches,
    starshipitShippedOrdersByAccount,
    ...shopifyOrderResponses
  ] = await Promise.all([
    ...(peoplevoxRelevant ? [getPeoplevoxRecentDispatches()] : [false]),
    ...(starshipitRelevant ? [getStarshipitShippedOrders()] : [false]),
    ...shopifyRegions.map(region => getShopifyOrdersPerRegion(region)),
  ]);

  // logDeep('pvxRecentDispatches', pvxRecentDispatches);
  // await askQuestion('?');

  // logDeep('starshipitShippedOrdersByAccount', starshipitShippedOrdersByAccount);
  // await askQuestion('?');

  // logDeep(shopifyOrderResponses);
  // await askQuestion('?');

  const arrayExhaustedCheck = (arr) => arr.length === 0;

  const starshipitShippedProcessorMaker = (piles, region, processorOptions = {}) => new Processor(
    piles.in,
    async (pile) => {
      const order = pile.shift();
      const { orderId, shippingLine } = order;
      const shippingMethod = shippingLine?.title;
      const starshipitAccount = shopifyRegionToStarshipitAccount(region, shippingMethod);
      const accountShippedOrders = starshipitShippedOrdersByAccount[starshipitAccount];
      const shippedOrder = accountShippedOrders.find(order => order.order_id === orderId);

      if (shippedOrder) {

        const { 
          // tracking_short_status: trackingShortStatus,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
        } = shippedOrder || {};
        
        // TODO: Consider using 'manifest_sent'
        if (!trackingNumber) {
          piles.disqualified.push(order);
          return;
        }
  
        // console.log(0, shippedOrder);
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
          // tracking: shippedOrder,
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
  const recentDispatchProcessorMaker = (piles, processorOptions = {}) => new Processor(
    piles.in,
    async (pile) => {
      const order = pile.shift();
      const { orderId } = order;
      const recentDispatch = pvxRecentDispatches.find(dispatch => dispatch['Salesorder number'] === orderId);

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
  
  // piles used: in, continue, resolved, disqualified
  const logiwaProcessorMaker = (piles, processorOptions = {}) => new Processor(
    piles.in,
    async (pile) => {
      const order = pile.shift();
      const { name: orderCode } = order;

      const logiwaOrderResponse = await logiwaOrderGet({ orderCode });

      if (!logiwaOrderResponse?.success || !logiwaOrderResponse?.result) {
        piles.continue.push(order);
        return;
      }

      const logiwaOrder = logiwaOrderResponse.result;
      const {
        currentTrackingNumber,
        trackingNumbers,
        products,
        shipmentOrderStatusName, // Shipped, Open, Cancelled, Shortage
      } = logiwaOrder;

      let trackingNumber = currentTrackingNumber;
      if (!trackingNumber && trackingNumbers?.length === 1) {
        trackingNumber = trackingNumbers[0];
      }

      const allShipped = products.every(product => product.shippedUOMQuantity === product.quantity);

      const knownBadStatuses = ['Open', 'Cancelled', 'Shortage', 'Ready to Pack', 'Picking Started'];
      const knownGoodStatuses = ['Shipped'];
      
      if (!knownGoodStatuses.includes(shipmentOrderStatusName)) {

        if (!knownBadStatuses.includes(shipmentOrderStatusName)) {
          console.log(logiwaOrder, logiwaOrder.code, shipmentOrderStatusName, trackingNumber, allShipped);
          await askQuestion('?');
        }

        piles.disqualified.push(order);
        return;
      }

      if (!trackingNumber || !allShipped) {
        console.log(`Logiwa processing, not fully shipped`, logiwaOrder);
        piles.disqualified.push(order);
        return;
      }

      const fulfillPayload = {
        originAddress: {
          // Logiwa, therefore US
          countryCode: 'US',
        },
        trackingInfo: {
          number: trackingNumber,
        },
      };

      piles.resolved.push({
        ...order,
        fulfillPayload,
      });
    },
    arrayExhaustedCheck, // pileExhaustedCheck
    processorOptions,
  );

  const pilesByRegion = {};

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

    if (REGIONS_STARSHIPIT.includes(region)) {
      pipeline.add({
        maker: starshipitShippedProcessorMaker,
        piles: { 
          resolved: piles.readyToFulfill,
        },
        makerArgs: [region],
        makerOptions: { logFlavourText: `${ region }:starprefetch:` },
      });
    }

    // Add PVX processors if region supports it
    if (REGIONS_PVX.includes(region)) {
      pipeline.add({
        maker: recentDispatchProcessorMaker,
        piles: { 
          // During a ProcessorPipeline, in: and continue: are dynamic
          resolved: piles.readyToFulfill,
        },
        makerOptions: { logFlavourText: `${ region }:pvxprefetch:` },
      });

      pipeline.add({
        maker: peoplevoxProcessorMaker,
        piles: { 
          resolved: piles.readyToFulfill,
        },
        makerOptions: { logFlavourText: `${ region }:pvx:` },
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
        makerOptions: { logFlavourText: `${ region }:starshipit:` },
      });
    }

    if (REGIONS_LOGIWA.includes(region)) {
      pipeline.add({
        maker: logiwaProcessorMaker,
        piles: { 
          resolved: piles.readyToFulfill,
          disqualified: piles.notShipped,
        },
        makerOptions: { logFlavourText: `${ region }:logiwa:` },
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
      makerOptions: { logFlavourText: `${ region }:fulfill:` },
    });
    
    const leftovers = await pipeline.run(inputPile);
    piles.unresolved = leftovers;

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