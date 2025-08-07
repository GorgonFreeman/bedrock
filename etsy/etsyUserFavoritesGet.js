const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyUserFavoritesGet = async (
  userId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/users/${ userId }/favorites/listings`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyUserFavoritesGetApi = async (req, res) => {
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

  const result = await etsyUserFavoritesGet(
    userId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyUserFavoritesGet,
  etsyUserFavoritesGetApi,
};

// curl localhost:8000/etsyUserFavoritesGet -H "Content-Type: application/json" -d '{ "userId": "123456" }' 