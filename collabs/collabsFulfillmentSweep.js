const { respond, mandateParam, logDeep, gidToId, askQuestion } = require('../utils');
const { REGIONS_PVX } = require('../constants');

const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');
const { peoplevoxOrdersGetById } = require('../peoplevox/peoplevoxOrdersGetById');
const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');

const collabsFulfillmentSweep = async (
  {
    shopifyRegions = REGIONS_PVX,
  } = {},
) => {
  
  // 1. Fetch unfulfilled orders for each region
  const shopifyOrderResponses = await Promise.all(
    shopifyRegions.map(region => shopifyOrdersGet(
      region,
      {
        queries: [
          'created_at:>2024-01-01',
          'fulfillment_status:unfulfilled',
          'status:Open',
        ],
      },
    )),
  );

  // 2. For each region, deplete array of unfulfilled orders by retrieving tracking info from other platforms specific to that region
  for (const [i, region] of shopifyRegions.entries()) {
    const shopifyOrderReponse = shopifyOrderResponses[i];

    const { success, result } = shopifyOrderReponse;
    if (!success) {
      return shopifyOrderReponse;
    }

    const shopifyOrders = result;
    const shopifyOrderIds = shopifyOrders.map(o => gidToId(o.id));

    if (REGIONS_PVX.includes(region)) {
      const peoplevoxOrdersResponse = await peoplevoxOrdersGetById(shopifyOrderIds);
      logDeep(peoplevoxOrdersResponse);
      await askQuestion('?');
    }
  }

  logDeep(shopifyOrderResponses);
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