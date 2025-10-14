const { funcApi, logDeep, surveyNestedArrays, Processor, askQuestion } = require('../utils');
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
    dataIncomplete: [],

    // actions
    starshipitProductUpdate: [],
  };

  const getters = [];
  const assessors = [];
  const actioners = [];

  const stylearcadeGetter = await stylearcadeDataGetter({
    onItems: (items) => {
      piles.inStylearcade.push(...items);
    },
  });
  getters.push(stylearcadeGetter);

  const peoplevoxCustomsDataGet = async () => {
    const reportResponse = await peoplevoxReportGet('Customs Data');
    piles.inPeoplevox = piles.inPeoplevox.concat(reportResponse.result); // concat to avoid max call size issue
  };
  getters.push(peoplevoxCustomsDataGet);

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
  getters.push(starshipitGetter);

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
  getters.push(...shopifyGetters);

  // 2. Assess all data and identify updates.

  piles.inStylearcade = piles.inStylearcade.map(({ data }) => data).filter(item => item);

  const assessingProcessor = new Processor(
    piles.inStylearcade,
    async (pile) => {
      const stylearcadeProduct = pile.shift();
      logDeep(stylearcadeProduct);
      // await askQuestion('Continue?');

      const {
        productId: skuTrunk,
        af55: hsCodeUs,
        af56: hsCodeUk,
        af58: customsDescription,
        af62: countryCodeOfOrigin,
      } = stylearcadeProduct;

      const skuTarget = `${ skuTrunk }-`;

      logDeep(hsCodeUs, hsCodeUk, customsDescription, countryCodeOfOrigin, skuTarget);
      // await askQuestion('Continue?');

      if (!(hsCodeUs || hsCodeUk || customsDescription)) {
        piles.dataIncomplete.push(stylearcadeProduct);
        return;
      }

      const peoplevoxItem = piles.inPeoplevox.find(item => item['Item code'].startsWith(skuTarget));
      const starshipitItem = piles.inStarshipit.find(item => item.sku.startsWith(skuTarget));
      const shopifyProducts = {};
      for (const region of regions) {
        const shopifyRegionProduct = piles.inShopify[region].find(item => item.variants.find(v => v.sku.startsWith(skuTarget)));
        shopifyProducts[region] = shopifyRegionProduct;
      }
      
      if (starshipitItem) {
        // Update if needed
      } else {
        // Add, if found in Shopify AU
      }

      if (peoplevoxItem) {
        // Update if needed
      }
       
      for (const region of regions) {
        if (shopifyProducts[region]) {
          // Update if needed
        }
      }

    },
    pile => pile.length === 0,
    {
      canFinish: false,
    },
  );
  assessors.push(assessingProcessor);

  let gettersFinished = 0;
  for (const getter of getters) {
    if (typeof getter.on === 'function') {
      getter.on('done', () => {
        gettersFinished++;
        if (gettersFinished === getters.length) {
          assessors.forEach(i => i.canFinish = true);
        }
      });
    } else {
      // Handle regular async functions
      getter().then(() => {
        gettersFinished++;
        if (gettersFinished === getters.length) {
          assessors.forEach(i => i.canFinish = true);
        }
      });
    }
  }

  let assessorsFinished = 0;
  for (const assessor of assessors) {
    assessor.on('done', () => {
      assessorsFinished++;
      if (assessorsFinished === assessors.length) {
        actioners.forEach(i => i.canFinish = true);
      }
    });
  }

  await Promise.all([
    ...getters.map(g => typeof g.run === 'function' ? g.run() : g()),
    ...assessors.map(a => a.run()),
    ...actioners.map(a => a.run()),
  ]);

  // 3. Action all updates.

  logDeep(piles);
  logDeep(surveyNestedArrays(piles));

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