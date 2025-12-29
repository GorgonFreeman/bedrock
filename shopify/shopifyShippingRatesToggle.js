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
      }
      locationGroupZones (first: 15) {
        edges {
          node {
            zone {
              id
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

  const profileLocationGroups = deliveryProfiles?.map(dp => dp?.profileLocationGroups);
  // logDeep('profileLocationGroups');
  const locationGroupZones = profileLocationGroups?.flat()?.map(plg => plg?.locationGroupZones);
  // logDeep('locationGroupZones');
  const methodDefinitions = locationGroupZones?.flat()?.map(lgz => lgz?.methodDefinitions);
  // logDeep('methodDefinitions');
  const methodConditions = methodDefinitions?.flat()?.map(methodDef => methodDef?.methodConditions);
  // logDeep('methodConditions');

  return { success: true, result: deliveryProfiles };
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