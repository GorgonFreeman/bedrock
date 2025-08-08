const { respond, mandateParam, credsByPath, CustomAxiosClient, logDeep } = require('../utils');
const { iwishClient } = require('../iwish/iwish.utils');

const iwishCustomerWishlistCountGet = async (
  credsPath,
  customerId,
  {
    option,
  } = {},
) => {

  const response = await iwishClient.fetch({
    url: `/V2/count/${ customerId }`,
    context: {
      credsPath,
    },
  });
  logDeep('response', response);
  return response;
};

const iwishCustomerWishlistCountGetApi = async (req, res) => {
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

  const result = await iwishCustomerWishlistCountGet(
    credsPath,
    customerId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  iwishCustomerWishlistCountGet,
  iwishCustomerWishlistCountGetApi,
};

// curl localhost:8000/iwishCustomerWishlistCountGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerId": "8575963103304" }'