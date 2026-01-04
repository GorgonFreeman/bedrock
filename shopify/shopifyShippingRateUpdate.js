// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageCreate

const { funcApi, gidToId, logDeep } = require('../utils');
const { shopifyMutationDo } = require('../shopify/shopify.utils');

const shopifyShippingRateUpdate = async (
  credsPath,
  deliveryProfileId,
  locationGroupId,
  zoneId,
  methodDefinitionId,
  {
    on = false,
    newName,
    apiVersion,
  } = {},
) => {

  const mutationName = 'deliveryProfileUpdate';

  const variables = {
    id: {
      type: 'ID!',
      value: `gid://shopify/DeliveryProfile/${ deliveryProfileId }`,
    },
    profile: {
      type: 'DeliveryProfileInput!',
      value: {
        locationGroupsToUpdate: [
          {
            id: `gid://shopify/DeliveryLocationGroup/${ locationGroupId }`,
            zonesToUpdate: [
              {
                id: `gid://shopify/DeliveryZone/${ zoneId }`,
                methodDefinitionsToUpdate: [
                  {
                    id: `gid://shopify/DeliveryMethodDefinition/${ methodDefinitionId }`,
                    active: on,
                    ...(newName && { name: newName }),
                  }
                ],
              },
            ],
          },
        ],
      },
    },
  };

  const returnAttrs = `profile {id name profileLocationGroups {
    locationGroup {
      id
    }
    locationGroupZones(first: 10) { edges { node {
      zone {
        id
        name
      }
      methodDefinitions(first: 10) { edges { node {
        id
        name
        active
      } } }
    } } }
  } }`;

  const response = await shopifyMutationDo(
    credsPath,
    mutationName,
    variables,
    returnAttrs,
    { 
      apiVersion,
    },
  );
  // logDeep(response);

  const { success, result, error } = response;
  if (!success) {
    return { success, error };
  }

  // filter the result to only the relevant method definition
  let filteredResult = [];
  if (
    result &&
    result.profile &&
    Array.isArray(result.profile.profileLocationGroups)
  ) {
    for (const group of result.profile.profileLocationGroups) {
      if (gidToId(group.locationGroup.id) === locationGroupId) {
        if (Array.isArray(group.locationGroupZones)) {
          for (const zoneObj of group.locationGroupZones) {
            if (gidToId(zoneObj.zone.id) === zoneId) {
              const filteredMethods = Array.isArray(zoneObj.methodDefinitions)
                ? zoneObj.methodDefinitions.filter(
                    md => gidToId(md.id) === methodDefinitionId
                  )
                : [];
              if (filteredMethods.length) {
                filteredResult.push({
                  zone: zoneObj.zone,
                  methodDefinitions: filteredMethods,
                });
              }
              break;
            }
          }
          break;
        }
      }
    }
  }
  // logDeep(filteredResult);
  return { success, result: filteredResult };
};

const shopifyShippingRateUpdateApi = funcApi(shopifyShippingRateUpdate, {
  argNames: ['credsPath', 'deliveryProfileId', 'locationGroupId', 'zoneId', 'methodDefinitionId', 'options'],
});

module.exports = {
  shopifyShippingRateUpdate,
  shopifyShippingRateUpdateApi,
};

// curl http://localhost:8000/shopifyShippingRateUpdate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "deliveryProfileId": "26827522120", "locationGroupId": "26827194440", "zoneId": "80695427144", "methodDefinitionId": "161943191624", "options": { "on": true } }'
// curl http://localhost:8000/shopifyShippingRateUpdate -H 'Content-Type: application/json' -d '{ "credsPath": "develop", "deliveryProfileId": "53640953993", "locationGroupId": "53833138313", "zoneId": "114917310601", "methodDefinitionId": "233061777545", "options": { "on": false } }'