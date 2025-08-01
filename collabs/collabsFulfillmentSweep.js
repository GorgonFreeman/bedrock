const { respond, mandateParam, logDeep, gidToId, askQuestion, dateTimeFromNow, weeks, Processor } = require('../utils');
const { REGIONS_PVX } = require('../constants');
const { shopifyRegionToStarshipitAccount } = require('../mappings');

const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');

const { peoplevoxOrdersGetById } = require('../peoplevox/peoplevoxOrdersGetById');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');
const { peoplevoxDateFormatter } = require('../peoplevox/peoplevox.utils');
const { peoplevoxDespatchesGetBySalesOrderNumber } = require('../peoplevox/peoplevoxDespatchesGetBySalesOrderNumber');

const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');

const collabsFulfillmentSweep = async (
  {
    shopifyRegions = REGIONS_PVX,
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
      notFound: [],
    };

    const recentDispatchProcessor = new Processor(
      inputPile, // pile
      // action
      async (pile) => {
        const order = pile.shift();
        const { orderId } = order;
        const recentDispatch = recentDispatches.find(dispatch => dispatch['Salesorder number'] === orderId);
        // console.log(recentDispatch);
        // await askQuestion('?');

        if (recentDispatch) {
          piles.found.push({
            ...order,
            tracking: recentDispatch,
          });
          return;
        }

        piles.notFound1.push(order);
        return;
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

    const peoplevoxProcessor = new Processor(
      piles.notFound1, // pile
      // action
      async (pile) => {
        const orders = pile.splice(0, 100);
        const orderIds = orders.map(o => o.orderId);
        const peoplevoxDispatchesResponse = await peoplevoxDespatchesGetBySalesOrderNumber(orderIds);
        // console.log(peoplevoxDispatches);
        // await askQuestion('?');

        if (!peoplevoxDispatchesResponse?.success) {
          piles.notPeoplevox.push(...orders);
          return;
        }

        const peoplevoxDispatches = peoplevoxDispatchesResponse.result;
        for (const order of orders) {
          const peoplevoxDispatch = peoplevoxDispatches.find(dispatch => dispatch['Salesorder number'] === order.orderId);

          if (peoplevoxDispatch) {
            piles.found.push({
              ...order,
              tracking: peoplevoxDispatch,
            });
            continue;
          }

          piles.notFound2.push(order);
          continue;
        }
      },
      (pile) => pile.length === 0, // pileExhaustedCheck
      // options
      {
        canFinish: false,
        logFlavourText: '2:',
      },
    );

    const starshipitProcessor = new Processor(
      piles.notRecentDispatch, // pile
      // action
      async (pile) => {
        const order = pile.shift();
        const { orderId, shippingLine } = order;
        const shippingMethod = shippingLine?.title;
        const starshipitAccount = shopifyRegionToStarshipitAccount(region, shippingMethod);
        const starshipitOrder = await starshipitOrderGet(starshipitAccount, { orderNumber: orderId });
        // console.log(starshipitOrder);
        // await askQuestion('?');

        if (starshipitOrder) {
          piles.found.push({
            ...order,
            tracking: starshipitOrder,
          });
          return;
        }

        piles.notFound2.push(order);
        return;
      },
      (pile) => pile.length === 0, // pileExhaustedCheck
      // options
      {
        canFinish: false,
        logFlavourText: '3:',
      },
    );

    recentDispatchProcessor.on('done', () => {
      peoplevoxProcessor.canFinish = true;
      starshipitProcessor.canFinish = true;
    });

    await Promise.all([
      recentDispatchProcessor.run({ verbose: true }),
      peoplevoxProcessor.run({ verbose: true }),
      starshipitProcessor.run({ verbose: true }),
    ]);

    console.log(piles);
  }

  // logDeep(shopifyOrderResponses);
  return shopifyOrderResponses;
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