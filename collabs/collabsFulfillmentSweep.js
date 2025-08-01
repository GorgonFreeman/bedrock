const { respond, mandateParam, logDeep, gidToId, askQuestion } = require('../utils');
const { REGIONS_PVX } = require('../constants');
const { shopifyRegionToStarshipitAccount } = require('../mappings');

const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');

const { peoplevoxOrdersGetById } = require('../peoplevox/peoplevoxOrdersGetById');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');
const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');

const collabsFulfillmentSweep = async (
  {
    shopifyRegions = REGIONS_PVX,
  } = {},
) => {
  
  // 1. Fetch unfulfilled orders for each region
  // 1a. Also prefetch any other useful data, e.g. pvx recent dispatches
  const [
    pvxRecentDispatchesResponse,
    ...shopifyOrderResponses
  ] = await Promise.all([
    peoplevoxReportGet('Despatch summary', { 
      columns: ['Salesorder number', 'Carrier', 'Tracking number', 'Despatch date'], 
      perPage: 4,
      searchClause: `([Despatch date] >= DateTime(2025,07,01,00,00,00)) AND ([Despatch date] <= DateTime(2025,08,01,00,00,00))`, 
    }),
    ...shopifyRegions.map(region => shopifyOrdersGet(
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
      },
    )),
  ]);

  logDeep(pvxRecentDispatchesResponse);
  await askQuestion('?');

  // 2. For each region, deplete array of unfulfilled orders by retrieving tracking info from other platforms specific to that region
  for (const [i, region] of shopifyRegions.entries()) {
    const shopifyOrderReponse = shopifyOrderResponses[i];

    const { success, result } = shopifyOrderReponse;
    if (!success) {
      return shopifyOrderReponse;
    }

    const shopifyOrders = result;
    console.log(region, shopifyOrders);
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