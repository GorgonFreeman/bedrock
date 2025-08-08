const { respond, mandateParam, credsByPath, CustomAxiosClient, logDeep } = require('../utils');
const { iwishGet } = require('../iwish/iwish.utils');

const iwishCustomerWishlistGet = async (
  credsPath,
  customerId,
  {
    ...getterOptions
  } = {},
) => {

  const response = await iwishGet(
    `/V2/fetchWishlistData/${ customerId }`,
    credsPath,
    {
      ...getterOptions
    },
  );
  logDeep('response', response);
  return response;
};

const iwishCustomerWishlistGetApi = async (req, res) => {
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

  const result = await iwishCustomerWishlistGet(
    credsPath,
    customerId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  iwishCustomerWishlistGet,
  iwishCustomerWishlistGetApi,
};

// curl localhost:8000/iwishCustomerWishlistGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerId": "2700981665864" }'