const { funcApi, logDeep, gidToId } = require('../utils');

const {
  REGIONS_PVX,
  REGIONS_LOGIWA,
  REGIONS_BLECKMANN,
} = require('../constants');

const { shopifyLocationGetMain } = require('../shopify/shopifyLocationGetMain');

const collabsInventoryCompare = async (
  region,
  {
    shopifyVariantsFetchQueries,
    minReportableDiff = 0,
    locationId,
    exportSheetIdentifier,
  } = {},
) => {

  const pvxRelevant = REGIONS_PVX.includes(region);
  const logiwaRelevant = REGIONS_LOGIWA.includes(region);
  const bleckmannRelevant = REGIONS_BLECKMANN.includes(region);
  const anyRelevant = [pvxRelevant, logiwaRelevant, bleckmannRelevant].some(Boolean);
  if (!anyRelevant) {
    return {
      success: false,
      message: 'Region not supported',
    };
  }

  if (!locationId) {
    console.log(`${ region }: Using main location`);

    const locationResponse = await shopifyLocationGetMain(region);

    const { 
      success: locationSuccess, 
      result: location, 
    } = locationResponse;
    if (!locationSuccess) {
      return locationResponse;
    }

    if (!location) {
      return {
        success: false,
        errors: ['No location found'],
      };
    }

    const { id: locationGid } = location;
    locationId = gidToId(locationGid);
  }

  !HOSTED && logDeep('locationId', locationId);

  return {
    success: true,
    result: {
      locationId,
    },
  };
};

const collabsInventoryCompareApi = funcApi(collabsInventoryCompare, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsInventoryCompare,
  collabsInventoryCompareApi,
};

// curl localhost:8000/collabsInventoryCompare -H "Content-Type: application/json" -d '{ "region": "au", "options": { "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved"] } }'
// curl localhost:8001/collabsInventoryCompare -H "Content-Type: application/json" -d '{ "region": "us", "options": { "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved", "tag_not:not_for_radial"] } }'
// curl localhost:8002/collabsInventoryCompare -H "Content-Type: application/json" -d '{ "region": "uk", "options": { "shopifyVariantsFetchQueries": ["published_status:published", "product_publication_status:approved"] } }'