const { respond, mandateParam, credsByPath, CustomAxiosClient } = require('../utils');

const iwishCustomerWishlistGet = async (
  credsPath,
  customerId,
  {
    option,
  } = {},
) => {

  const creds = credsByPath(['iwish', credsPath]);
  const { XTOKEN } = creds;
  const baseHeaders = {
    xtoken: XTOKEN,
  };

  const baseUrl = 'https://api.myshopapps.com/wishlist';

  const client = new CustomAxiosClient({
    baseUrl,
    baseHeaders,
  });

  const response = await client.fetch({
    url: `/V2/fetchWishlistData/${ customerId }`,
  });
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

// curl localhost:8000/iwishCustomerWishlistGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerId": "8575963103304" }'