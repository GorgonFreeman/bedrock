const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient } = require('../etsy/etsy.utils');

const etsyUserFeedbackGet = async (
  userId,
  {
    credsPath,
  } = {},
) => {
  const response = await etsyClient.fetch({ 
    url: `/application/users/${ userId }/feedback`,
    context: {
      credsPath,
    },
  });
  logDeep(response);
  return response;
};

const etsyUserFeedbackGetApi = async (req, res) => {
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

  const result = await etsyUserFeedbackGet(
    userId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyUserFeedbackGet,
  etsyUserFeedbackGetApi,
};

// curl localhost:8000/etsyUserFeedbackGet -H "Content-Type: application/json" -d '{ "userId": "123456" }' 