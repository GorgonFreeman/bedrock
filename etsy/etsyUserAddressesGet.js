const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyUserAddressesGet = async (
  userId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/users/${ userId }/addresses`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyUserAddressesGetApi = async (req, res) => {
  const { 
    userId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'userId', userId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await etsyUserAddressesGet(
    userId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyUserAddressesGet,
  etsyUserAddressesGetApi,
};

// curl localhost:8000/etsyUserAddressesGet -H "Content-Type: application/json" -d '{ "userId": "123456" }' 