const { respond, mandateParam, logDeep } = require('../utils');

const { REGIONS_WF } = require('../shopify/shopify.constants');
const { shopifyOrdersGet } = require('../shopify/shopifyOrdersGet');
const { peoplevoxOrdersGet } = require('../peoplevox/peoplevoxOrdersGet');
const { starshipitOrderGet } = require('../starshipit/starshipitOrderGet');

const collabsFulfillmentSweep = async (
  {
    shopifyRegions = REGIONS_WF,
  } = {},
) => {

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