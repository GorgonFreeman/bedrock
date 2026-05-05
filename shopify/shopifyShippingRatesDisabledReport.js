const { funcApi, logDeep } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { shopifyDeliveryProfilesGet } = require('../shopify/shopifyDeliveryProfilesGet');

const shopifyShippingRatesDisabledReport = async (
  {
    regions = REGIONS_WF,
    apiVersion,

    slackUsers = [
      'D07JF1E0SD8', // Zwe
    ],
  } = {},
) => {

  // 1. Fetch all shipping rates from all regions
  const deliveryProfileAttrs = `id name profileLocationGroups {
    locationGroup {
      id
    }
    locationGroupZones (first: 15) { edges { node {
      zone {
        id
        name
      }
      methodDefinitions (first: 10) { edges { node {
        id
        name
        active
      } } }
    } } }
  }`;

  // Flatten the shipping rates by store
  const flatForStore = (deliveryProfiles, store) => {
    return deliveryProfiles.map(dp => {
      const { id: deliveryProfileId, name: deliveryProfileName } = dp;
      return dp.profileLocationGroups.map(plg => {
        const { locationGroup } = plg;
        const { id: locationGroupId } = locationGroup;
        return plg.locationGroupZones.map(lgz => {
          const { zone } = lgz;
          const { id: locationGroupZoneId, name: locationGroupZoneName } = zone;
          return lgz.methodDefinitions.map(methodDef => {
            return {
              ...methodDef,
              store,
              deliveryProfileId,
              deliveryProfileName,
              locationGroupId,
              locationGroupZoneId,
              locationGroupZoneName,
            };
          });
        });
      });
    }).flat(3);
  };

  // Fetch all shipping rates from all regions
  const shippingRatesUnflattened = await Promise.all(
    regions.map(async (store) => {
      const deliveryProfilesResponse = await shopifyDeliveryProfilesGet(store, { attrs: deliveryProfileAttrs });
      const { success: deliveryProfilesGetSuccess, result: deliveryProfiles } = deliveryProfilesResponse;
      if (!deliveryProfilesGetSuccess || !deliveryProfiles?.length) {
        return [];
      }
      return flatForStore(deliveryProfiles, store);
    }),
  );
  shippingRates = shippingRatesUnflattened.flat();
  // logDeep({ shippingRates });

  // 2. Filter out the shipping rates that are disabled
  const disabledShippingRates = shippingRates.filter(rate => !rate.active);
  // logDeep({ disabledShippingRates });

  // 3. Report the disabled shipping rates to defined slack users/channels

  return {
    success: true,
    result: {},
  }
};

const shopifyShippingRatesDisabledReportApi = funcApi(shopifyShippingRatesDisabledReport, {
  argNames: ['options'],
});

module.exports = {
  shopifyShippingRatesDisabledReport,
  shopifyShippingRatesDisabledReportApi,
};

// curl localhost:8000/shopifyShippingRatesDisabledReport
// curl localhost:8000/shopifyShippingRatesDisabledReport -H "Content-Type: application/json" -d '{ "options": { "regions": ["au"] } }'