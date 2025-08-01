// https://shopify.dev/docs/api/admin-graphql/latest/queries/pages

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyGet } = require('../shopify/shopify.utils');

const defaultAttrs = `id title handle`;

const shopifyPagesGet = async (
  credsPath,
  {
    attrs = defaultAttrs,
    ...options
  } = {},
) => {

  const response = await shopifyGet(
    credsPath, 
    'page', 
    {
      attrs,
      ...options,
    },
  );

  return response;
};

const shopifyPagesGetApi = async (req, res) => {
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

  const result = await shopifyPagesGet(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyPagesGet,
  shopifyPagesGetApi,
};

// curl localhost:8000/shopifyPagesGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "options": { "limit": 2 } }'