// https://shopify.dev/docs/api/admin-graphql/latest/queries/orders

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const defaultAttrs = `id name`;

const shopifyOrdersGet = async (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => {

  const response = await shopifyGet(
    credsPath, 
    'order', 
    {
      attrs,
      ...options,
    },
  );

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
  shopifyOrdersGetApi,
};

// curl localhost:8000/shopifyOrdersGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'