// https://developers.etsy.com/documentation/reference/#operation/getUser

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyUserGet = async (
  userId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/users/${ userId }`,
    context: {
      credsPath,
      withBearer: true,
    },
  });
  logDeep(response);
  return response;
};

const etsyUserGetApi = async (req, res) => {
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

  const result = await etsyUserGet(
    userId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyUserGet,
  etsyUserGetApi,
};

// curl localhost:8000/etsyUserGet -H "Content-Type: application/json" -d '{ "userId": "123456" }' 