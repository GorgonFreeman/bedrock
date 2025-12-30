const { funcApi, logDeep } = require('../utils');
const { shopifyDeliveryProfilesGet } = require('../shopify/shopifyDeliveryProfilesGet');

const shopifyShippingRatesToggle = async (
  credsPath,
  keyword,
  on,
  {
    apiVersion,
    subkey,
  } = {},
) => {

  const deliveryProfileAttrs = `
    id
    name
    profileLocationGroups {
      locationGroup {
        id
        name
      }
      locationGroupZones (first: 15) {
        edges {
          node {
            zone {
              id
              name
            }
            methodDefinitions (first: 10) {
              edges {
                node {
                  id
                  name
                  methodConditions {
                    field
                    id
                    operator
                    conditionCriteria {
                      __typename
                      ... on MoneyV2 {
                        amount
                        currencyCode
                      }
                      ... on Weight {
                        unit
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;


  const deliveryProfilesResponse = await shopifyDeliveryProfilesGet(credsPath, { attrs: deliveryProfileAttrs, apiVersion });
  const { success: deliveryProfilesGetSuccess, result: deliveryProfiles } = deliveryProfilesResponse;
  if (!deliveryProfilesGetSuccess) {
    return deliveryProfilesResponse;
  }

  const shippingMethodDefinitions = deliveryProfiles.map(dp => {
    const { id: deliveryProfileId, name: deliveryProfileName } = dp;
    return dp.profileLocationGroups.map(plg => {
      const { locationGroup } = plg;
      const { id: locationGroupId, name: locationGroupName } = locationGroup;
      return plg.locationGroupZones.map(lgz => {
        const { zone } = lgz;
        const { id: locationGroupZoneId, name: locationGroupZoneName } = zone;
        return lgz.methodDefinitions.map(methodDef => {
          return {
            ...methodDef,
            deliveryProfileId,
            deliveryProfileName,
            locationGroupId,
            locationGroupName,
            locationGroupZoneId,
            locationGroupZoneName,
          };
        });
      });
    });
  }).flat(3);

  logDeep('shippingMethodDefinitions', shippingMethodDefinitions);

  const targetedShippingMethodDefinitions = shippingMethodDefinitions.filter(methodDef => methodDef.name.toLowerCase().includes(keyword.toLowerCase()));

  logDeep('targetedShippingMethodDefinitions', targetedShippingMethodDefinitions);

  return { success: true };
};

const shopifyShippingRatesToggleApi = funcApi(shopifyShippingRatesToggle, {
  argNames: ['credsPath', 'keyword', 'on', 'options'],
  allowCrossOrigin: true,
});

module.exports = {
  shopifyShippingRatesToggle,
  shopifyShippingRatesToggleApi,
};

// curl localhost:8000/shopifyShippingRatesToggle -H "Content-Type: application/json" -d '{ "credsPath": "au", "keyword": "standard", "on": true }'