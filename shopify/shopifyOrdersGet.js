// https://shopify.dev/docs/api/admin-graphql/latest/queries/orders

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyGet, shopifyGetter } = require('../shopify/shopify.utils');

const defaultAttrs = `id name`;

const payloadMaker = (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => [
  credsPath, 
  'order', 
  {
    attrs,
    ...options,
  },
];

const shopifyOrdersGet = async (...args) => {
  const response = await shopifyGet(...payloadMaker(...args));
  return response;
};

const shopifyOrdersGetter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const shopifyOrdersGetApi = async (req, res) => {
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

  const result = await shopifyOrdersGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyOrdersGet,
  shopifyOrdersGetter,
  shopifyOrdersGetApi,
};

// curl localhost:8000/shopifyOrdersGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'