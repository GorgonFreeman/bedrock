const { funcApi, logDeep, askQuestion } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');
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

    const toggleContinue = await askQuestion(`Continue? (y/n)`);
    if (toggleContinue !== 'y') {
      logDeep(`Skipping ${ methodDefinitionName } because user did not continue`);
      continue;
    }

    const response = await shopifyMutationDo(
      credsPath,
      'deliveryProfileUpdate',
      {
        profileId: {
          type: 'ID!',
          value: methodDefinitionDeliveryProfileId,
        },
        locationGroupId: {
          type: 'ID!',
          value: methodDefinitionLocationGroupId,
        },
        zoneId: {
          type: 'ID!',
          value: methodDefinitionLocationGroupZoneId,
        },
        methodDefinitionId: {
          type: 'ID!',
          value: methodDefinitionId,
        },
      },
      `methodDefinition { id name active description methodConditions }`,
      {
        apiVersion,
      },
    );

    const { success: methodDefinitionUpdateSuccess, result: methodDefinition } = response;
    if (!methodDefinitionUpdateSuccess) {
      logDeep(`Error toggling ${ methodDefinitionName } to ${ on ? 'enabled' : 'disabled' }`);
      logDeep(methodDefinition);
      continue;
    }

    logDeep(`Successfully toggled ${ methodDefinitionName } to ${ on ? 'enabled' : 'disabled' }`);
    logDeep(methodDefinition);

    await askQuestion(`Continue?`);
  }

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