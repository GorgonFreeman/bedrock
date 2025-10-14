const { funcApi, logDeep, surveyNestedArrays } = require('../utils');
const { REGIONS_WF } = require('../constants');

const { stylearcadeDataGetter } = require('../stylearcade/stylearcadeDataGet');

const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');

const { starshipitProductsGetter } = require('../starshipit/starshipitProductsGet');

const { shopifyProductsGetter } = require('../shopify/shopifyProductsGet');

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
    inShopify: {},
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

  const starshipitGetter = await starshipitProductsGetter(
    'wf',
    {
      attrs: `
        id
        metafields (namespace: "shipping_data") {
          edges { 
            node { 
              id
              namespace
              key
              value 
            } 
          } 
        }
        variants (first: 100) {
          edges {
            node {
              id
              sku
              inventoryItem {
                id
                harmonizedSystemCode
                countryCodeOfOrigin
              }
            }
          }
        }
      `,
      onItems: (items) => {
        piles.inStarshipit.push(...items);
      },
    },
  );

  // TODO: Convert these to bulk operations to remove the first: X risk
  const shopifyGetters = await Promise.all(regions.map(async (region) => await shopifyProductsGetter(
    region,
    {
      attrs: `
        id
        metafields (first: 10, namespace: "shipping_data") {
          edges { 
            node { 
              id
              namespace
              key
              value 
            } 
          } 
        }
        variants (first: 100) {
          edges {
            node {
              id
              sku
              inventoryItem {
                id
                harmonizedSystemCode
                countryCodeOfOrigin
              }
            }
          }
        }
      `,
      onItems: (items) => {
        piles.inShopify[region] = piles.inShopify[region] || [];
        piles.inShopify[region].push(...items);
      },
    },
  )));

  await Promise.all([
    stylearcadeGetter.run(),
    peoplevoxCustomsDataGet(),
    starshipitGetter.run(),
    ...shopifyGetters.map(g => g.run()),
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