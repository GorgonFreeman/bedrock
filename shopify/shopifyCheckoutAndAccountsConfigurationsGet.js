// https://shopify.dev/docs/api/admin-graphql/latest/queries/checkoutAndAccountsConfigurations

const { respond, mandateParam } = require('../utils');
const { shopifyGet, shopifyGetter } = require('../shopify/shopify.utils');

const defaultAttrs = `
  id
  name
  isPublished
  createdAt
  editedAt
  updatedAt
`;

const payloadMaker = (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => [
  credsPath,
  'checkoutAndAccountsConfiguration',
  {
    attrs,
    ...options,
  },
];

const shopifyCheckoutAndAccountsConfigurationsGet = async (...args) => {
  const response = await shopifyGet(...payloadMaker(...args));
  return response;
};

const shopifyCheckoutAndAccountsConfigurationsGetter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const shopifyCheckoutAndAccountsConfigurationsGetApi = async (req, res) => {
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

  const result = await shopifyCheckoutAndAccountsConfigurationsGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCheckoutAndAccountsConfigurationsGet,
  shopifyCheckoutAndAccountsConfigurationsGetter,
  shopifyCheckoutAndAccountsConfigurationsGetApi,
};

// curl localhost:8000/shopifyCheckoutAndAccountsConfigurationsGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "apiVersion": "2026-04" } }'
// curl localhost:8000/shopifyCheckoutAndAccountsConfigurationsGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "apiVersion": "2026-04", "queries": ["is_published:true"] } }'
