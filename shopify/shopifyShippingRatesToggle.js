const { funcApi, logDeep, askQuestion } = require('../utils');
const { shopifyShippingRateUpdate } = require('../shopify/shopifyShippingRateUpdate');
const { shopifyDeliveryProfilesGet } = require('../shopify/shopifyDeliveryProfilesGet');

const shopifyShippingRatesToggle = async (
  credsPath,
  keyword,
  {
    on = false,
    apiVersion,
    verbose = false,
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
              name
            }
            methodDefinitions (first: 10) {
              edges {
                node {
                  id
                  name
                  active
                  description
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
      const { id: locationGroupId } = locationGroup;
      return plg.locationGroupZones.map(lgz => {
        const { zone } = lgz;
        const { id: locationGroupZoneId, name: locationGroupZoneName } = zone;
        return lgz.methodDefinitions.map(methodDef => {
          return {
            ...methodDef,
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

  const targetedShippingMethodDefinitions = shippingMethodDefinitions.filter(methodDef => methodDef.name.toLowerCase().includes(keyword.toLowerCase()));

  for (const target of targetedShippingMethodDefinitions) {
    logDeep('target', target);
    const {
      id: methodDefinitionId,
      name: methodDefinitionName,
      active: methodDefinitionActive,
      description: methodDefinitionDescription,
      methodConditions: methodConditions,
      deliveryProfileId: methodDefinitionDeliveryProfileId,
      locationGroupId: methodDefinitionLocationGroupId,
      locationGroupZoneId: methodDefinitionLocationGroupZoneId,
    } = target;

    if (methodDefinitionActive === on) {
      logDeep(`Skipping ${ methodDefinitionName } because it is already ${ on ? 'enabled' : 'disabled' }`);
      continue;
    }

    logDeep(`Toggling ${ methodDefinitionName } to ${ on ? 'enabled' : 'disabled' }`);

    if (verbose) {
      const toggleContinue = await askQuestion(`Continue? (y/n): `);
      if (toggleContinue !== 'y') {
        logDeep(`Skipping ${ methodDefinitionName } because user did not continue`);
        continue;
      }
    }

    const updateResponse = await shopifyShippingRateUpdate(credsPath, methodDefinitionDeliveryProfileId, methodDefinitionLocationGroupId, methodDefinitionLocationGroupZoneId, methodDefinitionId, { on, apiVersion });
    const { success: updateSuccess, result: updateResult } = updateResponse;
    if (!updateSuccess) {
      return updateResponse;
    }

    logDeep(`Successfully toggled ${ methodDefinitionName } to ${ on ? 'enabled' : 'disabled' }`);

    if (verbose) {
      await askQuestion(`Continue to next method definition...`);
    }
  }

  return { success: true };
};

const shopifyShippingRatesToggleApi = funcApi(shopifyShippingRatesToggle, {
  argNames: ['credsPath', 'keyword', 'options'],
  allowCrossOrigin: true,
});

module.exports = {
  shopifyShippingRatesToggle,
  shopifyShippingRatesToggleApi,
};

// curl localhost:8000/shopifyShippingRatesToggle -H "Content-Type: application/json" -d '{ "credsPath": "develop", "keyword": "standard", "options": { "on": true } }'
// curl localhost:8000/shopifyShippingRatesToggle -H "Content-Type: application/json" -d '{ "credsPath": "develop", "keyword": "standard", "options": { "verbose": true, "on": false } }'