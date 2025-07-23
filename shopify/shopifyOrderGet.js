const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id name`;

const shopifyOrderGet = async (
  credsPath,
  orderId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyGetSingle(
    credsPath,
    'order',
    orderId,
    {
      apiVersion,
      attrs,
    },
  );

  logDeep(response);
  return response;
};

const shopifyOrderGetApi = async (req, res) => {
  const { 
    credsPath,
    orderId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'orderId', orderId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyOrderGet(
    credsPath,
    orderId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyOrderGet,
  shopifyOrderGetApi,
};

// curl localhost:8000/shopifyOrderGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "orderId": "7015155466312" }'