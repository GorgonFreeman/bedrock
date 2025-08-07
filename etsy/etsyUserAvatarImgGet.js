const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyUserAvatarImgGet = async (
  userId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/users/${ userId }/avatar-img`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyUserAvatarImgGetApi = async (req, res) => {
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

  const result = await etsyUserAvatarImgGet(
    userId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyUserAvatarImgGet,
  etsyUserAvatarImgGetApi,
};

// curl localhost:8000/etsyUserAvatarImgGet -H "Content-Type: application/json" -d '{ "userId": "123456" }' 