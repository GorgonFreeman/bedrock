// https://shopify.dev/docs/api/admin-graphql/latest/queries/deliveryProfiles

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyGet, shopifyGetter } = require('../shopify/shopify.utils');

const defaultAttrs = `
  id
  name
  profileLocationGroups {
    locationGroupZones(first: 10) {
      edges {
        node {
          zone {
            id
            name
          }
          methodDefinitions(first: 10) {
            edges {
              node {
                id
                name
                active
                description
              }
            }
          }
        }
      }
    }
  }`;

const payloadMaker = (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => {
  return [
    credsPath,
    'deliveryProfile',
    {
      attrs,
      ...options,
    },
  ];
};

const shopifyDeliveryProfilesGet = async (...args) => {
  const response = await shopifyGet(...payloadMaker(...args));
  logDeep(response);
  return response;
};

const shopifyDeliveryProfilesGetter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const shopifyDeliveryProfilesGetApi = async (req, res) => {
  const { 
    credsPath,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyDeliveryProfilesGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyDeliveryProfilesGet,
  shopifyDeliveryProfilesGetter,
  shopifyDeliveryProfilesGetApi,
};

// curl localhost:8000/shopifyDeliveryProfilesGet -H "Content-Type: application/json" -d '{ "credsPath": "au" }'