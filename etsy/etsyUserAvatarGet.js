const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyUserAvatarGet = async (
  userId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/users/${ userId }/avatar`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyUserAvatarGetApi = async (req, res) => {
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

  const result = await etsyUserAvatarGet(
    userId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyUserAvatarGet,
  etsyUserAvatarGetApi,
};

// curl localhost:8000/etsyUserAvatarGet -H "Content-Type: application/json" -d '{ "userId": "123456" }' 