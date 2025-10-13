const { funcApi, logDeep, surveyNestedArrays } = require('../utils');
const { REGIONS_WF } = require('../constants');

const { stylearcadeDataGetter } = require('../stylearcade/stylearcadeDataGet');

const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');

const collabsCustomsDataSweep = async (
  {
    regions = REGIONS_WF,
  } = {},
) => {

  // 1. Get all customs data from Style Arcade - this is the source of truth.
  // 1a. Get all customs data from Peoplevox.
  // 1b. Get all customs data from Starshipit.
  // 1c. Get all customs data from Shopify.

  const piles = {
    inStylearcade: [],
    inPeoplevox: [],
    inStarshipit: [],
    inShopify: [],
  };

  const stylearcadeGetter = await stylearcadeDataGetter({
    onItems: (items) => {
      piles.inStylearcade.push(...items);
    },
  });

  const peoplevoxCustomsDataGet = async () => {
    const reportResponse = await peoplevoxReportGet('Customs Data');
    piles.inPeoplevox = piles.inPeoplevox.concat(reportResponse.result); // concat to avoid max call size issue
  };

  await Promise.all([
    stylearcadeGetter.run(),
    peoplevoxCustomsDataGet(),
  ]);

  logDeep(piles);
  logDeep(surveyNestedArrays(piles));

  // 2. Assess all data and identify updates.

  // 3. Action all updates.

  return true;
  
};

const collabsCustomsDataSweepApi = funcApi(collabsCustomsDataSweep, {
  argNames: ['options'],
});

module.exports = {
  collabsCustomsDataSweep,
  collabsCustomsDataSweepApi,
};

// curl localhost:8000/collabsCustomsDataSweep