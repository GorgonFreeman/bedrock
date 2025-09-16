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
      columns: ['Salesorder number', 'Carrier', 'Tracking number', 'Despatch date'], 
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

  const fulfillers = [];

  logDeep(peoplevoxRecentDispatches);
  await askQuestion('?');
  
  if (peoplevoxRecentDispatches) {
    const peoplevoxFulfiller = new Processor(
      peoplevoxRecentDispatches, 
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
    fulfillers.push(peoplevoxFulfiller);
  }

  logDeep(starshipitRecentDispatches);
  await askQuestion('?');

  if (starshipitRecentDispatches) {
    const starshipitFulfiller = new Processor(
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
    fulfillers.push(starshipitFulfiller);
  }

  logDeep(logiwaRecentDispatches);
  await askQuestion('?');

  if (logiwaRecentDispatches) {
    const logiwaFulfiller = new Processor(
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
    fulfillers.push(logiwaFulfiller);
  }


  logDeep(bleckmannRecentDispatches);
  await askQuestion('?');

  if (bleckmannRecentDispatches) {
    const bleckmannFulfiller = new Processor(
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
    fulfillers.push(bleckmannFulfiller);
  }

  const results = await Promise.all(fulfillers.map(f => f.run()));

  logDeep(results);
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