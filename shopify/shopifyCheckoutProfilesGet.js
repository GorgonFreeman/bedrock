// https://shopify.dev/docs/api/admin-graphql/latest/queries/checkoutProfiles

const { respond, mandateParam } = require('../utils');
const { shopifyGet, shopifyGetter } = require('../shopify/shopify.utils');

const defaultAttrs = `
  id
  name
  isPublished
  createdAt
  editedAt
  updatedAt
  typOspPagesActive
`;

const payloadMaker = (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => [
  credsPath,
  'checkoutProfile',
  {
    attrs,
    ...options,
  },
];

const shopifyCheckoutProfilesGet = async (...args) => {
  const response = await shopifyGet(...payloadMaker(...args));
  return response;
};

const shopifyCheckoutProfilesGetter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const shopifyCheckoutProfilesGetApi = async (req, res) => {
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

  const result = await shopifyCheckoutProfilesGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCheckoutProfilesGet,
  shopifyCheckoutProfilesGetter,
  shopifyCheckoutProfilesGetApi,
};

// curl localhost:8000/shopifyCheckoutProfilesGet -H "Content-Type: application/json" -d '{ "credsPath": "au" }'
// curl localhost:8000/shopifyCheckoutProfilesGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "queries": ["is_published:true"] } }'
