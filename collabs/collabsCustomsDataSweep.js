const { funcApi, logDeep, surveyNestedArrays, Processor, askQuestion, gidToId } = require('../utils');
const { HOSTED, REGIONS_WF } = require('../constants');

const { stylearcadeDataGetter } = require('../stylearcade/stylearcadeDataGet');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');
const { starshipitProductsGetter } = require('../starshipit/starshipitProductsGet');
const { shopifyProductsGetter } = require('../shopify/shopifyProductsGet');

const { starshipitProductUpdate } = require('../starshipit/starshipitProductUpdate');
const { starshipitProductAdd } = require('../starshipit/starshipitProductAdd');
const { shopifyInventoryItemUpdate } = require('../shopify/shopifyInventoryItemUpdate');
const { shopifyMetafieldsSet } = require('../shopify/shopifyMetafieldsSet');
const { peoplevoxItemsEdit } = require('../peoplevox/peoplevoxItemsEdit');

const REGIONS = REGIONS_WF;

const collabsCustomsDataSweep = async () => {

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
    missing: [],

    // actions
    starshipitProductUpdate: [],
    starshipitProductAdd: [],
    shopifyInventoryItemUpdate: [],
    shopifyMetafieldsSet: [],
    peoplevoxItemsEdit: [],

    results: [],
  };

  const getters = [];
  const assessors = [];
  const actioners = [];

  const stylearcadeGetter = await stylearcadeDataGetter({
    onItems: (items) => {
      piles.inStylearcade.push(...items);
    },
    logFlavourText: 'stylearcadeGetter',
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
      onItems: (items) => {
        piles.inStarshipit.push(...items);
      },
      logFlavourText: 'starshipitGetter',
    },
  );
  getters.push(starshipitGetter);

  // TODO: Convert these to bulk operations to remove the first: X risk
  const shopifyGetters = await Promise.all(REGIONS.map(async (region) => await shopifyProductsGetter(
    region,
    {
      queries: [
        `published_status:published`,
      ],
      attrs: `
        id
        mfCustomsDescription: metafield(namespace: "shipping_data", key: "item_description") { 
          value 
        }
        mfHsCode: metafield(namespace: "shipping_data", key: "hs_code") { 
          value 
        }
        mfCountryCodeOfOrigin: metafield(namespace: "shipping_data", key: "country_code_of_origin") { 
          value 
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
      logFlavourText: `shopifyGetter:${ region }`,
    },
  )));
  getters.push(...shopifyGetters);

  // Run all getters before processing - otherwise processors start with partial data
  await Promise.all([
    ...getters.map(g => typeof g.run === 'function' ? g.run({ verbose: !HOSTED }) : g()),
  ]);
  
  // Filter Style Arcade pile before initialising assessor
  piles.inStylearcade = piles.inStylearcade.map(({ data }) => data).filter(Boolean);

  // 2. Assess all data and identify updates.

  const assessingProcessor = new Processor(
    piles.inStylearcade,
    async (pile) => {
      const stylearcadeProduct = pile.shift();
      // logDeep('stylearcadeProduct', stylearcadeProduct);
      // await askQuestion('Continue?');

      const {
        productId: skuTrunk,
        af55: hsCodeUs,
        af56: hsCodeUk,
        af58: customsDescription,
        af62: countryCodeOfOrigin = 'CN', // Default to China
      } = stylearcadeProduct;

      if (!(hsCodeUs && hsCodeUk && customsDescription)) {
        piles.dataIncomplete.push(stylearcadeProduct);
        return;
      }

      const skuTarget = `${ skuTrunk }-`;

      // TODO: Move this to a separate mapping file
      const countryOfOrigin = {
        au: 'Australia',
        cn: 'China',
      }[countryCodeOfOrigin.toLowerCase()];

      logDeep(hsCodeUs, hsCodeUk, customsDescription, countryCodeOfOrigin, skuTarget);
      // await askQuestion('Continue?');

      const shopifyAuProduct = piles.inShopify['au'].find(item => item.variants.find(v => v?.sku?.startsWith(skuTarget)));

      if (!shopifyAuProduct) {
        piles.missing.push(stylearcadeProduct);
        return;
      }

      const skus = shopifyAuProduct?.variants.map(v => v.sku);

      const peoplevoxItems = piles.inPeoplevox.filter(item => skus.includes(item['Item code']));
      if (peoplevoxItems?.length) {
        // add peoplevox update operations to pile
        for (const peoplevoxItem of peoplevoxItems) {

          const {
            'Item code': pvxSku,
            'Attribute 5': pvxHsCode,
            'Attribute 6': pvxCountryOfOrigin,
            'Attribute 8': pvxCustomsDescription,
          } = peoplevoxItem;

          const updatePayload = {
            ItemCode: pvxSku,
          };

          if (pvxHsCode !== hsCodeUs) {
            updatePayload.Attribute5 = hsCodeUs;
          }
          if (pvxCountryOfOrigin !== countryOfOrigin) {
            updatePayload.Attribute6 = countryOfOrigin;
          }
          if (pvxCustomsDescription !== customsDescription) {
            updatePayload.Attribute8 = customsDescription;
          }

          if (Object.keys(updatePayload).length > 1) {
            piles.peoplevoxItemsEdit.push(updatePayload);
          }
        }
      }

      // TODO: Consolidate into one loop through skus
      const starshipitItems = piles.inStarshipit.filter(item => skus.includes(item.sku));
      if (starshipitItems?.length) {
        // update incorrect starshipit items
        for (const starshipitItem of starshipitItems) {
          const {
            id: starshipitProductId,
            sku,
            hs_code: starshipitHsCode,          
            customs_description: starshipitCustomsDescription,
            country: starshipitCountry,
          } = starshipitItem;
  
          if (!(starshipitHsCode === hsCodeUs && starshipitCustomsDescription === customsDescription && starshipitCountry === countryOfOrigin)) {
            const starshipitUpdateArgs = [
              'wf',
              starshipitProductId,
              sku,
              {
                hs_code: hsCodeUs,
                customs_description: customsDescription,
                country: countryOfOrigin,
              },
            ];
            // logDeep(starshipitUpdateArgs);
            // await askQuestion('Continue?');
            piles.starshipitProductUpdate.push(starshipitUpdateArgs);
          }
        }
        
        // add missing starshipit items
        const missingSkus = skus.filter(sku => !starshipitItems.some(item => item.sku === sku));
        if (missingSkus?.length) {
          for (const missingSku of missingSkus) {
            const starshipitAddArgs = [
              'wf',
              missingSku,
              {
                hsCode: hsCodeUs,
                customsDescription: customsDescription,
                country: countryOfOrigin,
              },
            ];
            // logDeep(starshipitAddArgs);
            // await askQuestion('Continue?');
            piles.starshipitProductAdd.push(starshipitAddArgs);
          }
        }
      }

      for (const region of REGIONS) {

        const shopifyRegionProduct = (region === 'au') ? shopifyAuProduct : piles.inShopify[region].find(item => item.variants.find(v => v?.sku?.startsWith(skuTarget)));
        // logDeep(region, shopifyRegionProduct);
        // await askQuestion('Continue?');

        if (!shopifyRegionProduct) {
          piles.missing.push({
            ...stylearcadeProduct,
            platform: 'shopify',
            region,
          });
          continue;
        }

        const {
          id: productGid,
          variants,
          mfCustomsDescription,
          mfHsCode,
          mfCountryCodeOfOrigin,
        } = shopifyRegionProduct;

        const relevantHsCode = region === 'uk' ? hsCodeUk : hsCodeUs;

        const updateCustomsDescription = customsDescription && (mfCustomsDescription?.value !== customsDescription);
        const updateHsCode = relevantHsCode && (mfHsCode?.value !== relevantHsCode);
        const updateCountryCodeOfOrigin = countryCodeOfOrigin && (mfCountryCodeOfOrigin?.value !== countryCodeOfOrigin);

        if (updateCustomsDescription) {
          const metafields = [{
            ownerId: productGid,
            namespace: 'shipping_data',
            key: 'item_description',
            type: 'single_line_text_field',
            value: String(customsDescription),
          }];
          const shopifyMetafieldsSetArgs = [region, metafields];
          piles.shopifyMetafieldsSet.push(shopifyMetafieldsSetArgs);
        }

        if (updateHsCode) {
          const metafields = [{
            ownerId: productGid,
            namespace: 'shipping_data',
            key: 'hs_code',
            type: 'single_line_text_field',
            value: String(relevantHsCode),
          }];
          const shopifyMetafieldsSetArgs = [region, metafields];
          piles.shopifyMetafieldsSet.push(shopifyMetafieldsSetArgs);
        }

        if (updateCountryCodeOfOrigin) {
          const metafields = [{
            ownerId: productGid,
            namespace: 'shipping_data',
            key: 'country_code_of_origin',
            type: 'single_line_text_field',
            value: String(countryCodeOfOrigin),
          }];
          const shopifyMetafieldsSetArgs = [region, metafields];
          piles.shopifyMetafieldsSet.push(shopifyMetafieldsSetArgs);
        }

        if (updateHsCode || updateCountryCodeOfOrigin) {
          const inventoryItemUpdatePayloads = variants.map(v => {
            const { inventoryItem } = v;
            const { id: inventoryItemGid } = inventoryItem;
            const inventoryItemId = gidToId(inventoryItemGid);
            return [
              region,
              inventoryItemId,
              {
                harmonizedSystemCode: relevantHsCode,
                countryCodeOfOrigin: countryCodeOfOrigin,
              },
            ];
          });
          piles.shopifyInventoryItemUpdate.push(...inventoryItemUpdatePayloads);         
          continue;
        }
        
        for (const v of variants) {

          const { inventoryItem } = v;

          const { 
            id: inventoryItemGid,
            harmonizedSystemCode,
            countryCodeOfOrigin: currentCountryCodeOfOrigin,
          } = inventoryItem;
          const inventoryItemId = gidToId(inventoryItemGid);

          if (harmonizedSystemCode !== relevantHsCode || countryCodeOfOrigin !== currentCountryCodeOfOrigin) {
            const shopifyInventoryItemUpdateArgs = [
              region,
              inventoryItemId,
              {
                harmonizedSystemCode: relevantHsCode,
                countryCodeOfOrigin: countryCodeOfOrigin,
              },
            ];
            piles.shopifyInventoryItemUpdate.push(shopifyInventoryItemUpdateArgs);
          }
        }
      }
    },
    pile => pile.length === 0,
    {
      canFinish: true,
    },
  );
  assessors.push(assessingProcessor);

  // 3. Action all updates.

  const starshipitProductUpdater = new Processor(
    piles.starshipitProductUpdate,
    async (pile) => {
      const args = pile.shift();
      const response = await starshipitProductUpdate(...args);

      if (!response?.success) {
        logDeep('starshipitProductUpdate', response, args);
        await askQuestion('Continue?');
      }

      piles.results.push(response);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: 'starshipitProductUpdater',
    },
  );
  actioners.push(starshipitProductUpdater);

  const starshipitProductAdder = new Processor(
    piles.starshipitProductAdd,
    async (pile) => {
      const args = pile.shift();
      const response = await starshipitProductAdd(...args);

      if (!response?.success) {
        logDeep('starshipitProductAdd', response, args);
        await askQuestion('Continue?');
      }

      piles.results.push(response);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: 'starshipitProductAdder',
    },
  );
  actioners.push(starshipitProductAdder);

  const shopifyInventoryItemUpdater = new Processor(
    piles.shopifyInventoryItemUpdate,
    async (pile) => {
      const args = pile.shift();
      const response = await shopifyInventoryItemUpdate(...args);

      if (!response?.success) {
        logDeep('shopifyInventoryItemUpdate', response, args);
        await askQuestion('Continue?');
      }

      piles.results.push(response);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: 'shopifyInventoryItemUpdater',
    },
  );
  actioners.push(shopifyInventoryItemUpdater);

  const shopifyMetafieldsSetter = new Processor(
    piles.shopifyMetafieldsSet,
    async (pile) => {
      const args = pile.shift();
      const response = await shopifyMetafieldsSet(...args);

      if (!response?.success) {
        logDeep('shopifyMetafieldsSet', response, args);
        await askQuestion('Continue?');
      }

      piles.results.push(response);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: 'shopifyMetafieldsSetter',
    },
  );
  actioners.push(shopifyMetafieldsSetter);

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
    ...assessors.map(a => a.run()),
    ...actioners.map(a => a.run()),
  ]);

  logDeep(piles);
  logDeep(surveyNestedArrays(piles));

  return {
    success: true,
    result: piles,
  };
  
};

const collabsCustomsDataSweepApi = funcApi(collabsCustomsDataSweep, {
  argNames: ['options'],
});

module.exports = {
  collabsCustomsDataSweep,
  collabsCustomsDataSweepApi,
};

// curl localhost:8100/collabsCustomsDataSweep