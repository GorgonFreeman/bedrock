// Action fulfillments for any recently fulfilled orders. Purely platform > Shopify.

const { funcApi, dateTimeFromNow, days, logDeep, askQuestion, Processor } = require('../utils');
const {
  REGIONS_ALL,
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
  REGIONS_STARSHIPIT,
} = require('../constants');

const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');
const { peoplevoxDateFormatter } = require('../peoplevox/peoplevox.utils');

const { logiwaOrdersGet } = require('../logiwa/logiwaOrdersGet');
const { logiwaStatusToStatusId } = require('../logiwa/logiwa.utils');

const { bleckmannPickticketsGet } = require('../bleckmann/bleckmannPickticketsGet');

const { shopifyOrderFulfill } = require('../shopify/shopifyOrderFulfill');

const collabsFulfillmentSweepRecent = async (
  {
    regions = REGIONS_ALL,
  } = {},
) => {

  const recentWindowStartDate = dateTimeFromNow({ minus: days(2), dateOnly: true });
  const now = dateTimeFromNow({ dateOnly: true });

  const peoplevoxGetRecent = async () => {
    const peoplevoxRecentDispatchesResponse = await peoplevoxReportGet('Despatch summary', { 
      columns: ['Salesorder number', 'Carrier', 'Tracking number', 'Despatch date', 'Channel name', 'Site reference'], 
      searchClause: `([Despatch date] >= ${ peoplevoxDateFormatter(recentWindowStartDate) })`, 
    });

    const { 
      success: peoplevoxRecentDispatchesSuccess, 
      result: peoplevoxRecentDispatches,
    } = peoplevoxRecentDispatchesResponse;

    if (!peoplevoxRecentDispatchesSuccess) {
      return peoplevoxRecentDispatchesResponse;
    }

    return peoplevoxRecentDispatches;
  };

  const logiwaGetRecent = async () => {
    const logiwaRecentShippedOrdersResponse = await logiwaOrdersGet({
      createdDateTime_bt: `${ new Date(recentWindowStartDate).toISOString() },${ new Date().toISOString() }`,
      status_eq: logiwaStatusToStatusId('Shipped'),
    });

    const {
      success: logiwaRecentShippedOrdersSuccess,
      result: logiwaRecentShippedOrders,
    } = logiwaRecentShippedOrdersResponse;

    if (!logiwaRecentShippedOrdersSuccess) {
      return logiwaRecentShippedOrdersResponse;
    }

    return logiwaRecentShippedOrders;
  };

  const bleckmannGetRecent = async () => {
    const bleckmannShippedOrdersResponse = await bleckmannPickticketsGet({
      createdFrom: `${ recentWindowStartDate }T00:00:00Z`,
      status: 'SHIPPED',
    });

    const {
      success: bleckmannShippedOrdersSuccess,
      result: bleckmannShippedOrders,
    } = bleckmannShippedOrdersResponse;

    if (!bleckmannShippedOrdersSuccess) {
      return bleckmannShippedOrdersResponse;
    }

    return bleckmannShippedOrders;
  };

  const starshipitGetRecent = async () => {

  };
  
  const peoplevoxRelevant = regions.some(region => REGIONS_PVX.includes(region));
  const logiwaRelevant = regions.some(region => REGIONS_LOGIWA.includes(region));
  const bleckmannRelevant = regions.some(region => REGIONS_BLECKMANN.includes(region));
  const starshipitRelevant = regions.some(region => REGIONS_STARSHIPIT.includes(region));

  const anyRelevant = [peoplevoxRelevant, logiwaRelevant, bleckmannRelevant, starshipitRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      message: ['No regions supported'],
    };
  }

  const [
    peoplevoxRecentDispatches,
    starshipitRecentDispatches,
    logiwaRecentDispatches,
    bleckmannRecentDispatches,
  ] = await Promise.all([
    ...(peoplevoxRelevant ? [peoplevoxGetRecent()] : [false]),
    ...(starshipitRelevant ? [starshipitGetRecent()] : [false]),
    ...(logiwaRelevant ? [logiwaGetRecent()] : [false]),
    ...(bleckmannRelevant ? [bleckmannGetRecent()] : [false]),
  ]);

  const processors = [];
  const piles = {
    shopifyOrderFulfill: [],
    disqualified: [],
    results: [],
  };

  let fulfillerCanFinish = 0;

  logDeep(peoplevoxRecentDispatches);
  await askQuestion('?');
  
  if (peoplevoxRecentDispatches) {

    const peoplevoxHandleDispatch = async (dispatch) => {

      const {
        'Tracking number': trackingNumber,
        'Salesorder number': orderId,
        'Channel name': channelName,
      } = dispatch;

      if (!trackingNumber) {
        return;
      }

      const fulfillPayload = {
        originAddress: {
          // Peoplevox, therefore AU
          countryCode: 'AU',
        },
        trackingInfo: {
          number: trackingNumber,
        },
      };

      piles.shopifyOrderFulfill.push([
        channelName === 'BADDEST' ? 'baddest' : 'au',
        { orderId },
        {
          notifyCustomer: true,
          ...fulfillPayload,
        },
      ]);
    };

    const peoplevoxProcessor = new Processor(
      peoplevoxRecentDispatches, 
      async (pile) => {
        const dispatch = pile.shift();
        await peoplevoxHandleDispatch(dispatch);
      }, 
      pile => pile.length === 0, 
      {
        // canFinish: true,
        // runOptions: {
        //   interval: 20,
        // },
      },
    );
    processors.push(peoplevoxProcessor);
  }

  /*

  logDeep(starshipitRecentDispatches);
  await askQuestion('?');

  if (starshipitRecentDispatches) {
    const starshipitProcessor = new Processor(
      starshipitRecentDispatches, 
      async (pile) => {
        const dispatch = pile.shift();
        // logDeep(dispatch);
        // await askQuestion('?');
      }, 
      pile => pile.length === 0, 
      {
        // canFinish: true,
        runOptions: {
          interval: 20,
        },
      },
    );
    processors.push(starshipitProcessor);
  }

  */

  logDeep(logiwaRecentDispatches);
  await askQuestion('?');

  if (logiwaRecentDispatches) {

    const logiwaOrderDecider = async (logiwaOrder) => {
  
      const {
        code: orderName,
        currentTrackingNumber,
        trackingNumbers,
        products,
        shipmentOrderStatusName,
        shipmentOrderStatusId,
      } = logiwaOrder;
  
      let trackingNumber = currentTrackingNumber;
      if (!trackingNumber && trackingNumbers?.length === 1) {
        trackingNumber = trackingNumbers[0];
      }
  
      const allShipped = products.every(product => product.shippedUOMQuantity === product.quantity);
  
      const knownBadStatuses = [
        'Open', 
        'Cancelled', 
        'Shortage', 
        'Ready to Pick', 
        'Picking Started', 
        'Ready to Pack', 
        'On Hold',
      ];
      const knownGoodStatuses = [
        'Shipped',
      ];

      if (![...knownGoodStatuses, ...knownBadStatuses].includes(shipmentOrderStatusName)) {
        console.log(shipmentOrderStatusId, shipmentOrderStatusName);
        await askQuestion('Unknown status - please resolve in the code. This order will be skipped for this run.');
        return;
      }
      
      if (!knownGoodStatuses.includes(shipmentOrderStatusName)) {  
        piles.disqualified.push(logiwaOrder);
        return;
      }
  
      if (!trackingNumber || !allShipped) {
        piles.disqualified.push(logiwaOrder);
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
  
      piles.shopifyOrderFulfill.push([
        'us', // Logiwa, therefore US
        { orderName },
        {
          notifyCustomer: true,
          ...fulfillPayload,
        },
      ]);
    };

    const logiwaProcessor = new Processor(
      logiwaRecentDispatches, 
      async (pile) => {
        const dispatch = pile.shift();
        await logiwaOrderDecider(dispatch);
      }, 
      pile => pile.length === 0, 
      {
        // canFinish: true,
        // runOptions: {
        //   interval: 20,
        // },
      },
    );
    processors.push(logiwaProcessor);
  }

  /*

  logDeep(bleckmannRecentDispatches);
  await askQuestion('?');

  if (bleckmannRecentDispatches) {
    const bleckmannProcessor = new Processor(
      bleckmannRecentDispatches, 
      async (pile) => {
        const dispatch = pile.shift();
        // logDeep(dispatch);
        // await askQuestion('?');
      }, 
      pile => pile.length === 0, 
      {
        // canFinish: true,
        runOptions: {
          interval: 20,
        },
      },
    );
    processors.push(bleckmannProcessor);
  }

  */

  const shopifyOrderFulfillProcessor = new Processor(
    piles.shopifyOrderFulfill,
    async (pile) => {
      const [region, orderIdentifier, options] = pile.shift();
      const result = await shopifyOrderFulfill(region, orderIdentifier, options);
      piles.results.push(result);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      maxInFlightRequests: 0,
      runOptions: {
        interval: 20,
      },
    },
  );
  
  /* 
    Before adding the fulfiller to the array of processors, 
    allow the fulfiller to finish when all the non-fulfilling processors have finished.
  */
  const nonFulfillingProcessorsCount = processors.length;
  const allowFulfillerToFinish = () => {
    fulfillerCanFinish++;
    if (fulfillerCanFinish >= nonFulfillingProcessorsCount) {
      shopifyOrderFulfillProcessor.canFinish = true;
    }
  };
  for (const processor of processors) {
    processor.on('done', allowFulfillerToFinish);
  }

  processors.push(shopifyOrderFulfillProcessor);

  await Promise.all(processors.map(p => p.run()));

  // logDeep(piles);
  logDeep({
    ...Object.fromEntries(Object.entries(piles).map(([key, value]) => [key, value.length])),
  });
  console.log(`Fulfilled ${ piles.results.filter(r => r.success).length } orders`);

  return {
    success: true, 
    result: piles,
  };
};

const collabsFulfillmentSweepRecentApi = funcApi(collabsFulfillmentSweepRecent, {
  argNames: ['options'],
});

module.exports = {
  collabsFulfillmentSweepRecent,
  collabsFulfillmentSweepRecentApi,
};

// curl localhost:8000/collabsFulfillmentSweepRecent
// curl localhost:8000/collabsFulfillmentSweepRecent -H "Content-Type: application/json" -d '{ "options": { "regions": ["au", "baddest"] } }'
// curl localhost:8000/collabsFulfillmentSweepRecent -H "Content-Type: application/json" -d '{ "options": { "regions": ["us"] } }'