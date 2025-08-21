const { funcApi, dateTimeFromNow, weeks, logDeep } = require('../utils');

const { logiwaStatusToStatusId } = require('../logiwa/logiwa.utils');
const { logiwaOrdersGetter } = require('../logiwa/logiwaOrdersGet');

const { 
  REGIONS_LOGIWA,
} = require('../constants');

const collabsFulfillmentSweepV2 = async (
  region,
  {
    option,
  } = {},
) => {

  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  const anyRelevant = [logiwaRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }
  
  const shippedOrderGetters = [];
  const shippedWindowWeeksAgo = 2;
  const shippedWindowStartDate = dateTimeFromNow({ minus: weeks(shippedWindowWeeksAgo), dateOnly: true });
  
  const logiwaShippedOrders = [];
  if (logiwaRelevant) {
    const logiwaShippedGetter = await logiwaOrdersGetter({
      createdDateTime_bt: `${ new Date(shippedWindowStartDate).toISOString() },${ new Date().toISOString() }`,
      status_eq: logiwaStatusToStatusId('Shipped'),
      limit: 400,
      onItems: (items) => {
        logiwaShippedOrders.push(...items);
      },
    });
    shippedOrderGetters.push(logiwaShippedGetter);
  }

  await Promise.all(shippedOrderGetters.map(getter => getter.run()));

  logDeep(logiwaShippedOrders);
  return {
    success: true,
    result: logiwaShippedOrders,
  };
};

const collabsFulfillmentSweepV2Api = funcApi(collabsFulfillmentSweepV2, {
  argNames: ['region', 'options'],
  validatorsByArg: {
    region: Boolean,
  },
});

module.exports = {
  collabsFulfillmentSweepV2,
  collabsFulfillmentSweepV2Api,
};

// curl localhost:8000/collabsFulfillmentSweepV2 -H "Content-Type: application/json" -d '{ "region": "us" }'