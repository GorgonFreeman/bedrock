// https://developers.etsy.com/documentation/reference/#operation/deleteUserAddress

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyUserAddressDelete = async (
  addressId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/user/addresses/${ addressId }`,
    method: 'delete',
    context: {
      credsPath,
      withBearer: true,
    },
  });
  logDeep(response);
  return response;
};

const etsyUserAddressDeleteApi = async (req, res) => {
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

  const result = await etsyUserAddressDelete(
    addressId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyUserAddressDelete,
  etsyUserAddressDeleteApi,
};

// curl localhost:8000/etsyUserAddressDelete -H "Content-Type: application/json" -d '{ "addressId": "123456" }' 