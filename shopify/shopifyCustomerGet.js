const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { shopifyGetSingle } = require('../shopify/shopifyGetSingle');

const defaultAttrs = `id firstName lastName email phone`;

const shopifyCustomerGet = async (
  credsPath,
  {
    customerId,
    customId,
    email,
    phone,
  },
  {
    apiVersion,
    attrs = defaultAttrs,
  } = {},
) => {

  if (!customerId) {
    return {
      success: false,
      error: ['Implement logic to find customerId from customId, email, or phone'],
    };
  }

  if (!customerId) {
    return {
      success: false,
      error: ['Customer ID not found'],
    };
  }

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
    customerIdentifier,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'customerIdentifier', customerIdentifier, p => objHasAny(p, ['customerId', 'customId', 'email', 'phone'])),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyCustomerGet(
    credsPath,
    customerIdentifier,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCustomerGet,
  shopifyCustomerGetApi,
};

// curl localhost:8000/shopifyCustomerGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerIdentifier": { "customerId": "5868161368132" } }'