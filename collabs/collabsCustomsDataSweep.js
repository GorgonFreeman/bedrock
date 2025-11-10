/*
  Syncs customs data such as HS Code and Customs Description from Style Arcade
  to Peoplevox, Starshipit and Shopify.
*/

const { funcApi, logDeep, surveyNestedArrays, Processor, askQuestion, gidToId, randomItem } = require('../utils');
const { HOSTED, REGIONS_WF } = require('../constants');
const { MIDS_WF } = require('../bedrock_unlisted/constants');

const { stylearcadeDataGetter } = require('../stylearcade/stylearcadeDataGet');
const { peoplevoxReportGet } = require('../peoplevox/peoplevoxReportGet');
const { starshipitProductsGetter } = require('../starshipit/starshipitProductsGet');
const { shopifyProductsGetter } = require('../shopify/shopifyProductsGet');

const { starshipitProductUpdate } = require('../starshipit/starshipitProductUpdate');
const { starshipitProductAdd } = require('../starshipit/starshipitProductAdd');
const { shopifyInventoryItemUpdate } = require('../shopify/shopifyInventoryItemUpdate');
const { shopifyMetafieldsSet } = require('../shopify/shopifyMetafieldsSet');
const { peoplevoxItemsEdit } = require('../peoplevox/peoplevoxItemsEdit');

const { bedrock_unlisted_slackErrorPost } = require('../bedrock_unlisted/bedrock_unlisted_slackErrorPost');

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
        mfMid: metafield(namespace: "shipping_data", key: "mids") { 
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
        af55: hsCodeUk,
        af56: hsCodeUs,
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

      !HOSTED && logDeep(hsCodeUs, hsCodeUk, customsDescription, countryCodeOfOrigin, skuTarget);
      // await askQuestion('Continue?');

      const shopifyAuProduct = piles.inShopify['au']?.find(item => item?.variants?.find(v => v?.sku?.startsWith(skuTarget)));

      if (!shopifyAuProduct) {
        piles.missing.push(stylearcadeProduct);
        return;
      }

      const skus = shopifyAuProduct?.variants.map(v => v.sku);
      const mid = shopifyAuProduct?.mfMid?.value || randomItem(MIDS_WF); // assign MID if not set

      const peoplevoxItems = piles.inPeoplevox.filter(item => skus.includes(item['Item code']));
      if (peoplevoxItems?.length) {
        // add peoplevox update operations to pile
        for (const peoplevoxItem of peoplevoxItems) {

          const {
            'Item code': pvxSku,
            'Attribute5': pvxHsCode,
            'Attribute6': pvxCountryOfOrigin,
            'Attribute7': pvxMid,
            'Attribute8': pvxCustomsDescription,
          } = peoplevoxItem;

          const updatePayload = {
            ItemCode: pvxSku,
          };

          if (pvxHsCode !== hsCodeUs) {
            !HOSTED && logDeep(`[Peoplevox Update] SKU: ${ pvxSku }, Field: HS Code, Current: "${ pvxHsCode }", Expected: "${ hsCodeUs }"`);
            updatePayload.Attribute5 = hsCodeUs;
          }
          if (pvxCountryOfOrigin !== countryOfOrigin) {
            !HOSTED && logDeep(`[Peoplevox Update] SKU: ${ pvxSku }, Field: Country of Origin, Current: "${ pvxCountryOfOrigin }", Expected: "${ countryOfOrigin }"`);
            updatePayload.Attribute6 = countryOfOrigin;
          }
          if (pvxCustomsDescription !== customsDescription) {
            !HOSTED && logDeep(`[Peoplevox Update] SKU: ${ pvxSku }, Field: Customs Description, Current: "${ pvxCustomsDescription }", Expected: "${ customsDescription }"`);
            updatePayload.Attribute8 = customsDescription;
          }
          if (pvxMid !== mid) {
            !HOSTED && logDeep(`[Peoplevox Update] SKU: ${ pvxSku }, Field: MID, Current: "${ pvxMid }", Expected: "${ mid }"`);
            updatePayload.Attribute7 = mid;
          }
          
          if (Object.keys(updatePayload).length > 1) {
            !HOSTED && logDeep(peoplevoxItem);
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
            mid: starshipitMid,
          } = starshipitItem;
  
          if (!(starshipitHsCode === hsCodeUs && starshipitCustomsDescription === customsDescription && starshipitCountry === countryOfOrigin && starshipitMid === mid)) {
            
            if (!HOSTED) {
              if (starshipitHsCode !== hsCodeUs) {
                logDeep(`[Starshipit Update] SKU: ${ sku }, Field: HS Code, Current: "${ starshipitHsCode }", Expected: "${ hsCodeUs }"`);
              }
              if (starshipitCustomsDescription !== customsDescription) {
                logDeep(`[Starshipit Update] SKU: ${ sku }, Field: Customs Description, Current: "${ starshipitCustomsDescription }", Expected: "${ customsDescription }"`);
              }
              if (starshipitCountry !== countryOfOrigin) {
                logDeep(`[Starshipit Update] SKU: ${ sku }, Field: Country, Current: "${ starshipitCountry }", Expected: "${ countryOfOrigin }"`);
              }
              if (starshipitMid !== mid) {
                logDeep(`[Starshipit Update] SKU: ${ sku }, Field: MID, Current: "${ starshipitMid }", Expected: "${ mid }"`);
              }
            }
            
            const starshipitUpdateArgs = [
              'wf',
              starshipitProductId,
              sku,
              {
                hs_code: hsCodeUs,
                customs_description: customsDescription,
                country: countryOfOrigin,
                mid,
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
                mid,
              },
            ];
            // logDeep(starshipitAddArgs);
            // await askQuestion('Continue?');
            piles.starshipitProductAdd.push(starshipitAddArgs);
          }
        }
      }

      for (const region of REGIONS) {

        const shopifyRegionProduct = (region === 'au') ? shopifyAuProduct : piles.inShopify[region]?.find(item => item?.variants?.find(v => v?.sku?.startsWith(skuTarget)));
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
          mfMid,
        } = shopifyRegionProduct;

        const relevantHsCode = region === 'uk' ? hsCodeUk : hsCodeUs;

        const updateCustomsDescription = customsDescription && (mfCustomsDescription?.value !== customsDescription);
        const updateHsCode = relevantHsCode && (mfHsCode?.value !== relevantHsCode);
        const updateCountryCodeOfOrigin = countryCodeOfOrigin && (mfCountryCodeOfOrigin?.value !== countryCodeOfOrigin);
        const updateMid = mid && (mfMid?.value !== mid);

        if (updateCustomsDescription) {
          !HOSTED && logDeep(`[Shopify Metafield Update] Region: ${ region }, Product: ${ productGid }, Field: item_description, Current: "${ mfCustomsDescription?.value }", Expected: "${ customsDescription }"`);
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
          !HOSTED && logDeep(`[Shopify Metafield Update] Region: ${ region }, Product: ${ productGid }, Field: hs_code, Current: "${ mfHsCode?.value }", Expected: "${ relevantHsCode }"`);
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
          !HOSTED && logDeep(`[Shopify Metafield Update] Region: ${ region }, Product: ${ productGid }, Field: country_code_of_origin, Current: "${ mfCountryCodeOfOrigin?.value }", Expected: "${ countryCodeOfOrigin }"`);
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

        if (updateMid) {
          !HOSTED && logDeep(`[Shopify Metafield Update] Region: ${ region }, Product: ${ productGid }, Field: mids, Current: "${ mfMid?.value }", Expected: "${ mid }"`);
          const metafields = [{
            ownerId: productGid,
            namespace: 'shipping_data',
            key: 'mids',
            type: 'single_line_text_field',
            value: String(mid),
          }];
          const shopifyMetafieldsSetArgs = [region, metafields];
          piles.shopifyMetafieldsSet.push(shopifyMetafieldsSetArgs);
        }

        if (updateHsCode || updateCountryCodeOfOrigin) {
          
          if (!HOSTED) {
            variants.forEach(v => {
              const { inventoryItem, sku: variantSku } = v;
              const { harmonizedSystemCode: currentHsCode, countryCodeOfOrigin: currentCountryCode } = inventoryItem;
              if (updateHsCode) {
                logDeep(`[Shopify Inventory Item Update] Region: ${ region }, SKU: ${ variantSku }, Field: harmonizedSystemCode, Current: "${ currentHsCode }", Expected: "${ relevantHsCode }"`);
              }
              if (updateCountryCodeOfOrigin) {
                logDeep(`[Shopify Inventory Item Update] Region: ${ region }, SKU: ${ variantSku }, Field: countryCodeOfOrigin, Current: "${ currentCountryCode }", Expected: "${ countryCodeOfOrigin }"`);
              }
            });
          }

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
            
            if (!HOSTED) {
              if (harmonizedSystemCode !== relevantHsCode) {
                logDeep(`[Shopify Inventory Item Update] Region: ${ region }, SKU: ${ v.sku }, Field: harmonizedSystemCode, Current: "${ harmonizedSystemCode }", Expected: "${ relevantHsCode }"`);
              }
              if (currentCountryCodeOfOrigin !== countryCodeOfOrigin) {
                logDeep(`[Shopify Inventory Item Update] Region: ${ region }, SKU: ${ v.sku }, Field: countryCodeOfOrigin, Current: "${ currentCountryCodeOfOrigin }", Expected: "${ countryCodeOfOrigin }"`);
              }
            }
            
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
        !HOSTED && logDeep('starshipitProductUpdate', response, args);
        // await askQuestion('Continue?');
      }

      // piles.results.push(response);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: 'starshipitProductUpdater',
      runOptions: {
        interval: 20,
      },
    },
  );
  actioners.push(starshipitProductUpdater);

  const starshipitProductAdder = new Processor(
    piles.starshipitProductAdd,
    async (pile) => {
      const args = pile.shift();
      const response = await starshipitProductAdd(...args);

      if (!response?.success) {
        !HOSTED && logDeep('starshipitProductAdd', response, args);
        // await askQuestion('Continue?');
      }

      // piles.results.push(response);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: 'starshipitProductAdder',
      runOptions: {
        interval: 20,
      },
    },
  );
  actioners.push(starshipitProductAdder);

  const shopifyInventoryItemUpdater = new Processor(
    piles.shopifyInventoryItemUpdate,
    async (pile) => {
      const args = pile.shift();
      const response = await shopifyInventoryItemUpdate(...args);

      if (!response?.success) {
        !HOSTED && logDeep('shopifyInventoryItemUpdate', response, args);
        // await askQuestion('Continue?');
      }

      // piles.results.push(response);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: 'shopifyInventoryItemUpdater',
      runOptions: {
        interval: 20,
      },
    },
  );
  actioners.push(shopifyInventoryItemUpdater);

  const shopifyMetafieldsSetter = new Processor(
    piles.shopifyMetafieldsSet,
    async (pile) => {
      const args = pile.shift();
      const response = await shopifyMetafieldsSet(...args);

      if (!response?.success) {
        !HOSTED && logDeep('shopifyMetafieldsSet', response, args);
        // await askQuestion('Continue?');
      }

      // piles.results.push(response);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: 'shopifyMetafieldsSetter',
      runOptions: {
        interval: 20,
      },
    },
  );
  actioners.push(shopifyMetafieldsSetter);

  const peoplevoxItemsUpdater = new Processor(
    piles.peoplevoxItemsEdit,
    async (pile) => {
      const payloads = pile.splice(0, pile.length);
      const response = await peoplevoxItemsEdit(payloads);

      if (!response?.success) {
        !HOSTED && logDeep('peoplevoxItemsEdit', response, payloads);
        // await askQuestion('Continue?');
      }

      // piles.results.push(response);
    },
    pile => pile.length === 0,
    {
      canFinish: false,
      logFlavourText: 'peoplevoxItemsUpdater',
    },
  );
  actioners.push(peoplevoxItemsUpdater);

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
    ...assessors.map(a => a.run({ verbose: !HOSTED })),
    ...actioners.map(a => a.run({ verbose: !HOSTED })),
  ]);

  !HOSTED && logDeep(piles);
  logDeep(surveyNestedArrays(piles));

  return {
    success: true,
    result: piles,
  };
  
};

const collabsCustomsDataSweepApi = funcApi(collabsCustomsDataSweep, {
  argNames: ['options'],
  errorReporter: bedrock_unlisted_slackErrorPost,
});

module.exports = {
  collabsCustomsDataSweep,
  collabsCustomsDataSweepApi,
};

// curl localhost:8100/collabsCustomsDataSweep