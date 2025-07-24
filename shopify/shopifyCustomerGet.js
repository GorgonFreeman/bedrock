const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id firstName lastName email phone`;

const shopifyCustomerGet = async (
  credsPath,
  customerId,
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  const response = await shopifyGetSingle(
    credsPath,
    'customer',
    customerId,
    {
      apiVersion,
      attrs,
    },
  );

  logDeep(response);
  return response;
};

const shopifyCustomerGetApi = async (req, res) => {
  const { 
    credsPath,
    customerId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'customerId', customerId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyCustomerGet(
    credsPath,
    customerId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCustomerGet,
  shopifyCustomerGetApi,
};

// curl localhost:8000/shopifyCustomerGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerId": "5868161368132" }'