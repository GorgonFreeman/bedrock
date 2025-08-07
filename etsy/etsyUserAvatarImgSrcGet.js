const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyUserAvatarImgSrcGet = async (
  userId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/users/${ userId }/avatar-img-src`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyUserAvatarImgSrcGetApi = async (req, res) => {
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

  const result = await etsyUserAvatarImgSrcGet(
    userId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyUserAvatarImgSrcGet,
  etsyUserAvatarImgSrcGetApi,
};

// curl localhost:8000/etsyUserAvatarImgSrcGet -H "Content-Type: application/json" -d '{ "userId": "123456" }' 