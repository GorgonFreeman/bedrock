// https://shopify.dev/docs/api/admin-graphql/latest/queries/customers

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyGet, shopifyGetter } = require('../shopify/shopify.utils');

const defaultAttrs = `id email`;

const payloadMaker = (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => {
  return [
    credsPath,
    'customer',
    {
      attrs,
      ...options,
    },
  ];
};

const shopifyCustomersGet = async (...args) => {
  const response = await shopifyGet(...payloadMaker(...args));
  return response;
};

const shopifyCustomersGetter = async (...args) => {
  const response = await shopifyGetter(...payloadMaker(...args));
  return response;
};

const shopifyCustomersGetApi = async (req, res) => {
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

  const result = await shopifyCustomersGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCustomersGet,
  shopifyCustomersGetter,
  shopifyCustomersGetApi,
};

// curl localhost:8000/shopifyCustomersGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'