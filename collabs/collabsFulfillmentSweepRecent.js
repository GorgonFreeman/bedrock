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
  };

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

      logDeep(dispatch, fulfillPayload);
      await askQuestion('?');

      piles.shopifyOrderFulfill.push([
        channelName === 'BADDEST' ? 'baddest' : 'au',
        orderId,
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
        runOptions: {
          interval: 20,
        },
      },
    );
    processors.push(peoplevoxProcessor);
  }

  logDeep(starshipitRecentDispatches);
  await askQuestion('?');

  if (starshipitRecentDispatches) {
    const starshipitProcessor = new Processor(
      starshipitRecentDispatches, 
      async (pile) => {
        const dispatch = pile.shift();
        logDeep(dispatch);
        await askQuestion('?');
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

  logDeep(logiwaRecentDispatches);
  await askQuestion('?');

  if (logiwaRecentDispatches) {
    const logiwaProcessor = new Processor(
      logiwaRecentDispatches, 
      async (pile) => {
        const dispatch = pile.shift();
        logDeep(dispatch);
        await askQuestion('?');
      }, 
      pile => pile.length === 0, 
      {
        // canFinish: true,
        runOptions: {
          interval: 20,
        },
      },
    );
    processors.push(logiwaProcessor);
  }


  logDeep(bleckmannRecentDispatches);
  await askQuestion('?');

  if (bleckmannRecentDispatches) {
    const bleckmannProcessor = new Processor(
      bleckmannRecentDispatches, 
      async (pile) => {
        const dispatch = pile.shift();
        logDeep(dispatch);
        await askQuestion('?');
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

  const results = await Promise.all(processors.map(p => p.run()));

  logDeep(piles.shopifyOrderFulfill);

  return {
    success: true, 
    result: results,
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
// curl localhost:8000/collabsFulfillmentSweepRecent -H "Content-Type: application/json" -d '{ "options": { "regions": ["au"] } }'