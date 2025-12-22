// https://shopify.dev/docs/api/admin-graphql/latest/queries/deliveryProfile

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

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
                active
                description
              }
            }
          }
        }
      }
    }
  }`;

const shopifyDeliveryProfileGet = async (
  credsPath,
  {
    deliveryProfileId,
  },
  {
    attrs = defaultAttrs,
    apiVersion,
  } = {},
) => {

  const response = await shopifyGetSingle(
    credsPath,
    'deliveryProfile',
    deliveryProfileId,
    {
      apiVersion,
      attrs,
    },
  );

  logDeep(response);
  return response;
};

const shopifyDeliveryProfileGetApi = async (req, res) => {
  const { 
    credsPath,
    deliveryProfileIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'deliveryProfileIdentifier', deliveryProfileIdentifier, p => objHasAny(p, ['deliveryProfileId'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyDeliveryProfileGet(
    credsPath,
    deliveryProfileIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyDeliveryProfileGet,
  shopifyDeliveryProfileGetApi,
};

// curl localhost:8000/shopifyDeliveryProfileGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "deliveryProfileIdentifier": { "deliveryProfileId": "26827522120" } }'