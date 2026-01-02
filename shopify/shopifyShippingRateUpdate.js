// https://shopify.dev/docs/api/admin-graphql/latest/mutations/pageCreate

const { funcApi, logDeep } = require('../utils');
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

  const response = await shopifyMutationDo(
    credsPath,
    mutationName,
    variables,
    `profile { id name }`,
    { 
      apiVersion,
    },
  );
  logDeep(response);
  return { success: true, result: response };
};

const shopifyShippingRateUpdateApi = funcApi(shopifyShippingRateUpdate, {
  argNames: ['credsPath', 'deliveryProfileId', 'locationGroupId', 'zoneId', 'methodDefinitionId', 'options'],
});

module.exports = {
  shopifyShippingRateUpdate,
  shopifyShippingRateUpdateApi,
};

// curl http://localhost:8000/shopifyShippingRateUpdate -H 'Content-Type: application/json' -d '{ "credsPath": "au", "deliveryProfileId": "26827522120", "locationGroupId": "26827194440", "zoneId": "80695427144", "methodDefinitionId": "161943191624", "options": { "on": true } }'
// curl http://localhost:8000/shopifyShippingRateUpdate -H 'Content-Type: application/json' -d '{ "credsPath": "develop", "deliveryProfileId": "76077858953", "locationGroupId": "77231915145", "zoneId": "212678115465", "methodDefinitionId": "362892329097", "options": { "on": false } }'