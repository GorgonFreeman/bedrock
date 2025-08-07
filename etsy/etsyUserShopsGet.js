const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyUserShopsGet = async (
  userId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/users/${ userId }/shops`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyUserShopsGetApi = async (req, res) => {
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

  const result = await etsyUserShopsGet(
    userId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyUserShopsGet,
  etsyUserShopsGetApi,
};

// curl localhost:8000/etsyUserShopsGet -H "Content-Type: application/json" -d '{ "userId": "123456" }' 