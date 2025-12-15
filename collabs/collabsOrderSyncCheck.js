// Check the latest WMS orders to establish how far behind the sync is

const { funcApi, gidToId, askQuestion, logDeep } = require('../utils');
const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyOrderGet } = require('../shopify/shopifyOrderGet');

const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');

const { bleckmannPickticketsGetter } = require('../bleckmann/bleckmannPickticketsGet');

const { logiwaOrdersGetter } = require('../logiwa/logiwaOrdersGet');

const collabsOrderSyncCheck = async (
  region,
  {
    option,
  } = {},
) => {

  const pvxRelevant = REGIONS_PVX.includes(region);
  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  const bleckmannRelevant = REGIONS_BLECKMANN.includes(region);
  const anyRelevant = [pvxRelevant, logiwaRelevant, bleckmannRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      error: ['No platform finder relevant to this region'],
    };
  }

  if (pvxRelevant) {
  }

  if (logiwaRelevant) {
  }

  if (bleckmannRelevant) {
  }

};

const collabsOrderSyncCheckApi = funcApi(collabsOrderSyncCheck, {
  argNames: ['region', 'options'],
});

module.exports = {
  collabsOrderSyncCheck,
  collabsOrderSyncCheckApi,
};

// curl localhost:8000/collabsOrderSyncCheck -H "Content-Type: application/json" -d '{ "region": "au" }'
// curl localhost:8000/collabsOrderSyncCheck -H "Content-Type: application/json" -d '{ "region": "us" }'
// curl localhost:8000/collabsOrderSyncCheck -H "Content-Type: application/json" -d '{ "region": "uk" }'