const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyUserAddressGet = async (
  addressId,
  {
    credsPath,
  } = {},
) => {

  const response = await etsyClient.fetch({ 
    url: `/application/user/addresses/${ addressId }`,
    context: {
      credsPath,
      withBearer: true,
    },
  });
  logDeep(response);
  return response;
};

const etsyUserAddressGetApi = async (req, res) => {
  const { 
    addressId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'addressId', addressId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await etsyUserAddressGet(
    addressId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyUserAddressGet,
  etsyUserAddressGetApi,
};

// curl localhost:8000/etsyUserAddressGet -H "Content-Type: application/json" -d '{ "addressId": "1296125024835" }' 