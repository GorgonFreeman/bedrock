const { HOSTED } = require('../constants');

const { funcApi, logDeep, gidToId, askQuestion } = require('../utils');
const { shopifyShippingRateUpdate } = require('../shopify/shopifyShippingRateUpdate');
const { shopifyDeliveryProfilesGet } = require('../shopify/shopifyDeliveryProfilesGet');

const shopifyShippingRatesToggle = async (
  credsPath,
  mode, // enable, disable
  {
    keyword,
  },
  {
    apiVersion,
    verbose = false, // If true, list all targetted rates and ask for confirmation before toggling
    subkey,
  } = {},
) => {

  // Validate mode
  if (mode !== 'enable' && mode !== 'disable') {
    return { success: false, error: `Invalid mode: ${ mode }` };
  }
  const enableRate = mode === 'enable';

  // Validate ratesIdentifier
  if (HOSTED
    && !keyword
  ) {
    return { success: false, error: 'Missing rates identifier' };
  }

  const result = [];
  const errors = [];
  const success = true;
  
  const disabledSuffix = ' [Disabled]';

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

  // Fetch all shipping rates / delivery profiles
  const deliveryProfilesResponse = await shopifyDeliveryProfilesGet(credsPath, { attrs: deliveryProfileAttrs, apiVersion });
  const { success: deliveryProfilesGetSuccess, result: deliveryProfiles } = deliveryProfilesResponse;
  if (!deliveryProfilesGetSuccess) {
    return deliveryProfilesResponse;
  }

  // Map and flatten all delivery profiles to shipping method definitions
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

  // Identify the targetted shipping method definitions
  const targetedShippingMethodDefinitions = (() => {
    if (!keyword) {
      verbose = true;
      return shippingMethodDefinitions;
    }
    return shippingMethodDefinitions.filter(methodDef => methodDef.name.toLowerCase().includes(keyword.toLowerCase()));
  })();

  if (targetedShippingMethodDefinitions.length === 0) {
    return { success: false, error: 'No targetted shipping method definitions found' };
  }

  // Action the targetted shipping method definitions
  for (const target of targetedShippingMethodDefinitions) {
    const {
      id: methodDefinitionId,
      name: methodDefinitionName,
      active: methodDefinitionActive,
      description: methodDefinitionDescription,
      methodConditions: methodConditions,
      deliveryProfileId: methodDefinitionDeliveryProfileId,
      deliveryProfileName: methodDefinitionDeliveryProfileName,
      locationGroupId: methodDefinitionLocationGroupId,
      locationGroupZoneId: methodDefinitionLocationGroupZoneId,
      locationGroupZoneName: methodDefinitionLocationGroupZoneName,
    } = target;

    if (methodDefinitionActive === enableRate) {
      logDeep(`Skipping ${ methodDefinitionName } (${ methodDefinitionDeliveryProfileName }/ ${ methodDefinitionLocationGroupZoneName }) because it is already ${ enableRate ? 'enabled' : 'disabled' }`);
      continue;
    }

    logDeep(`Toggling ${ methodDefinitionName } (${ methodDefinitionDeliveryProfileName }/ ${ methodDefinitionLocationGroupZoneName }) to ${ enableRate ? 'enabled' : 'disabled' }`);

    if (verbose) {
      const toggleContinue = await askQuestion(`Continue? (y/n): `);
      if (toggleContinue !== 'y') {
        logDeep(`Skipping ${ methodDefinitionName } (${ methodDefinitionDeliveryProfileName }/ ${ methodDefinitionLocationGroupZoneName }) because user did not continue`);
        console.log(`--------------------------------`);
        continue;
      }
    }

    const newName = (() => {
    if (enableRate) {
      if (methodDefinitionName.endsWith(disabledSuffix)) {
        return methodDefinitionName.slice(0, -disabledSuffix.length);
      }
      return null;
    } else {
      if (!methodDefinitionName.endsWith(disabledSuffix)) {
        return methodDefinitionName + disabledSuffix;
      }
      return null;
    }
    })();

    const updateResponse = await shopifyShippingRateUpdate(
      credsPath,
      gidToId(methodDefinitionDeliveryProfileId),
      gidToId(methodDefinitionLocationGroupId),
      gidToId(methodDefinitionLocationGroupZoneId),
      gidToId(methodDefinitionId),
      {
        on: enableRate,
        newName,
        apiVersion,
      },
    );
    const { success: updateSuccess, result: updateResult } = updateResponse;
    if (!updateSuccess) {
      errors.push(updateResult);
      logDeep(`Error toggling ${ methodDefinitionName } (${ methodDefinitionDeliveryProfileName }/ ${ methodDefinitionLocationGroupZoneName }): ${ updateResponse.error }`);
      success = false;
      continue;
    }

    logDeep(`Successfully toggled ${ methodDefinitionName } to ${ enableRate ? 'enabled' : 'disabled' }`);
    console.log(`--------------------------------`);
    result.push(updateResult);

    if (verbose) {
      await askQuestion(`Continue to next method definition?`);
      console.log(`--------------------------------`);
    }
  }

  return { success, result, errors };
};

const shopifyShippingRatesToggleApi = funcApi(shopifyShippingRatesToggle, {
  argNames: ['credsPath', 'mode', 'ratesIdentifier', 'options'],
  allowCrossOrigin: true,
});

module.exports = {
  shopifyShippingRatesToggle,
  shopifyShippingRatesToggleApi,
};

// curl localhost:8000/shopifyShippingRatesToggle -H "Content-Type: application/json" -d '{ "credsPath": "develop", "mode": "enable", "ratesIdentifier": { } }'
// curl localhost:8000/shopifyShippingRatesToggle -H "Content-Type: application/json" -d '{ "credsPath": "develop", "mode": "disable", "ratesIdentifier": { } }'
// curl localhost:8000/shopifyShippingRatesToggle -H "Content-Type: application/json" -d '{ "credsPath": "develop", "mode": "enable", "ratesIdentifier": { "keyword": "standard" } }'
// curl localhost:8000/shopifyShippingRatesToggle -H "Content-Type: application/json" -d '{ "credsPath": "develop", "mode": "disable", "ratesIdentifier": { "keyword": "standard" }, "options": { "verbose": true } }'