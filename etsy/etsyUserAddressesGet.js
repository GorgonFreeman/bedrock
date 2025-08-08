// https://developers.etsy.com/documentation/reference/#operation/getUserAddresses

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyGet } = require('../etsy/etsy.utils');

const etsyUserAddressesGet = async (
  {
    credsPath,
  } = {},
) => {

  const response = await etsyGet('/application/user/addresses', { 
    context: {
      credsPath,
      withBearer: true,
    },
  });
  logDeep(response);
  return response;
};

const etsyUserAddressesGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'userId', userId),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await etsyUserAddressesGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyUserAddressesGet,
  etsyUserAddressesGetApi,
};

// curl localhost:8000/etsyUserAddressesGet