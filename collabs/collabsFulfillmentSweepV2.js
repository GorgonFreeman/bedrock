const { funcApi, dateTimeFromNow, weeks } = require('../utils');

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

  const shippedGetters = [];
  const shippedOrders = [];

  const shippedWindowWeeksAgo = 2;
  const shippedWindowStartDate = dateTimeFromNow({ minus: weeks(shippedWindowWeeksAgo), dateOnly: true });

  const logiwaShippedGetter = await logiwaOrdersGetter({
    createdDateTime_bt: `${ new Date(shippedWindowStartDate).toISOString() },${ new Date().toISOString() }`,
    status_eq: logiwaStatusToStatusId('Shipped'),
    onItems: (items) => {
      shippedOrders.push(...items);
    },
  });

  if (logiwaRelevant) {
    shippedGetters.push(logiwaShippedGetter);
  }

  await Promise.all(shippedGetters.map(getter => getter.run()));

  logDeep(shippedOrders);
  return {
    success: true,
    result: shippedOrders,
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