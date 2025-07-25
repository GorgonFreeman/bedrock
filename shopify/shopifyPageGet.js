// https://shopify.dev/docs/api/admin-graphql/latest/queries/page

const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id title handle`;

const shopifyPageGet = async (
  credsPath,
  pageId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyGetSingle(
    credsPath,
    'page',
    pageId,
    {
      apiVersion,
      attrs,
    },
  );

  logDeep(response);
  return response;
};

const shopifyPageGetApi = async (req, res) => {
  const { 
    credsPath,
    pageId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'pageId', pageId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyPageGet(
    credsPath,
    pageId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyPageGet,
  shopifyPageGetApi,
};

// curl localhost:8000/shopifyPageGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "pageId": "45501415496" }'