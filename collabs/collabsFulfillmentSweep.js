const { respond, mandateParam, logDeep, gidToId, askQuestion, dateTimeFromNow, weeks, Processor } = require('../utils');
const { REGIONS_PVX } = require('../constants');
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
    shopifyRegions = REGIONS_PVX,
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
        'fulfillment_status:unfulfilled',
        'status:Open',
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

  const recentDispatchProcessorFactory = (
    inPile, 
    successPile, 
    failurePile,
  ) => new Processor(
    inPile, // pile
    // action
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

        successPile.push({
          ...order,
          // tracking: recentDispatch,
          fulfillPayload,
        });
        return;
      }

      failurePile.push(order);
    },
    (pile) => pile.length === 0, // pileExhaustedCheck
    // options
    {
      logFlavourText: '1:',
      // onDone: () => {
      //   otherProcessor.canFinish = true;
      // },
    },
  );

  const peoplevoxProcessorFactory = (
    inPile, 
    successPile, 
    failurePile,
  ) => new Processor(
    inPile, // pile
    // action
    async (pile) => {
      const orders = pile.splice(0, 100);
      const orderIds = orders.map(o => o.orderId);
      const peoplevoxDispatchesResponse = await peoplevoxDespatchesGetBySalesOrderNumber(orderIds);
      // console.log(peoplevoxDispatches);
      // await askQuestion('?');

      if (!peoplevoxDispatchesResponse?.success) {
        failurePile.push(...orders);
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

          successPile.push({
            ...order,
            // tracking: peoplevoxDispatch,
            fulfillPayload,
          });
          continue;
        }

        failurePile.push(order);
      }
    },
    (pile) => pile.length === 0, // pileExhaustedCheck
    // options
    {
      canFinish: false,
      logFlavourText: '2:',
    },
  );

  const starshipitProcessorFactory = (
    inPile, 
    successPile, 
    failurePile,
    disqualifyPile,
  ) => new Processor(
    inPile, // pile
    // action
    async (pile) => {
      const order = pile.shift();
      const { orderId, shippingLine } = order;
      const shippingMethod = shippingLine?.title;
      const starshipitAccount = shopifyRegionToStarshipitAccount(region, shippingMethod);
      const starshipitOrderResponse = await starshipitOrderGet(starshipitAccount, { orderNumber: orderId });

      if (!starshipitOrderResponse?.success || !starshipitOrderResponse?.result) {
        failurePile.push(order);
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
          disqualifyPile.push(order);
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

        successPile.push({
          ...order,
          // tracking: starshipitOrder,
          fulfillPayload,
        });
        return;
      }

      failurePile.push(order);
    },
    (pile) => pile.length === 0, // pileExhaustedCheck
    // options
    {
      canFinish: false,
      logFlavourText: '3:',
    },
  );

  const fulfillingProcessorFactory = (
    inPile, 
    successPile, 
    failurePile,
    region,
  ) => new Processor(
    inPile, // pile
    // action
    async (pile) => {
      const order = pile.shift();
      const { orderId, fulfillPayload } = order;

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
        failurePile.push({
          ...order,
          fulfillResponse,
        });
        return;
      }

      successPile.push({
        ...order,
        fulfillResponse,
      });
    },
    (pile) => pile.length === 0, // pileExhaustedCheck
    // options
    {
      canFinish: false,
      logFlavourText: '4:',
    },
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
      found: [],
      notFound1: [],
      notFound2: [],
      notFound3: [],
      notFound: [],
      notShipped: [], // dead end
      error: [],
      fulfilled: [],
    };

    const recentDispatchProcessor = recentDispatchProcessorFactory(
      inputPile,
      piles.found,
      piles.notFound1,
    );

    const peoplevoxProcessor = peoplevoxProcessorFactory(
      piles.notFound1,
      piles.found,
      piles.notFound2,
    );

    const starshipitProcessor = starshipitProcessorFactory(
      piles.notFound2,
      piles.found,
      piles.notFound3,
      piles.notShipped,
    );

    const fulfillingProcessor = fulfillingProcessorFactory(
      piles.found,
      piles.fulfilled,
      piles.error,
      region,
    );

    recentDispatchProcessor.on('done', () => {
      peoplevoxProcessor.canFinish = true;
    });

    peoplevoxProcessor.on('done', () => {
      starshipitProcessor.canFinish = true;
    });

    starshipitProcessor.on('done', () => {
      fulfillingProcessor.canFinish = true;
    });

    await Promise.all([
      recentDispatchProcessor.run({ verbose: true }),
      peoplevoxProcessor.run({ verbose: true }),
      starshipitProcessor.run({ verbose: true }),
      // TODO: Processor where if we fail to get tracking info anywhere, we check the order in Peoplevox for whether it's dispatched + released.
      fulfillingProcessor.run({ verbose: true, interval: 200 }),
    ]);

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