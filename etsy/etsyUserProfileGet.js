const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyUserProfileGet = async (
  userId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/users/${ userId }/profile`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyUserProfileGetApi = async (req, res) => {
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

  const result = await etsyUserProfileGet(
    userId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyUserProfileGet,
  etsyUserProfileGetApi,
};

// curl localhost:8000/etsyUserProfileGet -H "Content-Type: application/json" -d '{ "userId": "123456" }' 