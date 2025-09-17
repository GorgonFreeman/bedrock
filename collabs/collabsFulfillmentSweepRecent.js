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
const { bleckmannParcelsGet } = require('../bleckmann/bleckmannParcelsGet');

const { shopifyOrderFulfill } = require('../shopify/shopifyOrderFulfill');
const { shopifyFulfillmentOrderFulfill } = require('../shopify/shopifyFulfillmentOrderFulfill');

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
    shopifyFulfillmentOrderFulfill: [],
    disqualified: [],
    errors: [],
    results: [],
  };
  
  if (peoplevoxRecentDispatches) {

    logDeep('peoplevoxRecentDispatches', peoplevoxRecentDispatches?.[0], peoplevoxRecentDispatches?.length);
    await askQuestion('?');

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

  if (starshipitRecentDispatches) {

    logDeep('starshipitRecentDispatches', starshipitRecentDispatches?.[0], starshipitRecentDispatches?.length);
    await askQuestion('?');

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

  if (logiwaRecentDispatches) {

    logDeep('logiwaRecentDispatches', logiwaRecentDispatches?.[0], logiwaRecentDispatches?.length);
    await askQuestion('?');

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

  if (bleckmannRecentDispatches) {

    logDeep('bleckmannRecentDispatches', bleckmannRecentDispatches?.[0], bleckmannRecentDispatches?.length);
    await askQuestion('?');

    const bleckmannDispatchDecider = async (dispatch) => {
      const {
        reference: orderId,
        pickticketId: fulfillmentOrderId,
      } = dispatch;

      const bleckmannParcelsResponse = await bleckmannParcelsGet({ pickticketId: fulfillmentOrderId }, { includeDetails: true });
      const { success: parcelsSuccess, result: parcels } = bleckmannParcelsResponse;
      if (!parcelsSuccess || !parcels?.length) {
        piles.errors.push(bleckmannParcelsResponse);
        return;
      }

      for (const parcel of parcels) {
        const {
          trackingNumber,
          trackingUrl,
          carrierName,
          lines,
        } = parcel;

        if (!trackingNumber) {
          piles.disqualified.push(parcel);
          continue;
        }

        piles.shopifyFulfillmentOrderFulfill.push([
          'uk', // Bleckmann, therefore UK
          fulfillmentOrderId,
          {
            externalLineItems: lines,
            externalLineItemsConfig: {
              extSkuProp: 'skuId',
              shopifyQuantityProp: 'quantity',
            },

            notifyCustomer: true,

            originAddress: {
              // Bleckmann, therefore GB
              countryCode: 'GB',
            },

            trackingInfo: {
              number: trackingNumber,
              url: trackingUrl,
              company: carrierName,
            },
          },
        ]);
      }
    };

    const bleckmannProcessor = new Processor(
      bleckmannRecentDispatches, 
      async (pile) => {
        const dispatch = pile.shift();
        await bleckmannDispatchDecider(dispatch);
      }, 
      pile => pile.length === 0, 
      {
        // canFinish: true,
        // runOptions: {
        //   interval: 20,
        // },
      },
    );
    processors.push(bleckmannProcessor);
  }

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

  const shopifyFulfillmentOrderFulfillProcessor = new Processor(
    piles.shopifyFulfillmentOrderFulfill,
    async (pile) => {
      const args = pile.shift();
      logDeep('args', args);
      const result = await shopifyFulfillmentOrderFulfill(...args);
      piles.results.push(result);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      maxInFlightRequests: 0,
      // runOptions: {
      //   interval: 20,
      // },
    },
  );
  
  /* 
    Before adding the fulfiller to the array of processors, 
    allow the fulfiller to finish when all the non-fulfilling processors have finished.
  */
  let processorsFinished = 0;
  const nonFulfillingProcessorsCount = processors.length;
  const recordProcessorFinished = () => {
    processorsFinished++;
    const fulfillersCanFinish = processorsFinished >= nonFulfillingProcessorsCount;
    if (fulfillersCanFinish) {
      shopifyOrderFulfillProcessor.canFinish = true;
      shopifyFulfillmentOrderFulfillProcessor.canFinish = true;
    }
  };
  for (const processor of processors) {
    processor.on('done', recordProcessorFinished);
  }

  processors.push(shopifyOrderFulfillProcessor);
  processors.push(shopifyFulfillmentOrderFulfillProcessor);

  await Promise.all(processors.map(p => p.run()));

  // logDeep(piles);
  logDeep({
    ...Object.fromEntries(Object.entries(piles).map(([key, value]) => [key, value.length])),
  });
  const successfulResults = piles.results.filter(r => r.success);
  logDeep('successfulResults', successfulResults);
  console.log(`Fulfilled ${ successfulResults.length } orders`);

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
// curl localhost:8000/collabsFulfillmentSweepRecent -H "Content-Type: application/json" -d '{ "options": { "regions": ["uk"] } }'