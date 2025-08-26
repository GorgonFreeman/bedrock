const { respond, mandateParam } = require('../utils');

const slackMessagePost = async (
  arg,
  {
    option,
  } = {},
) => {

  return { 
    arg, 
    option,
  };
  
};

const slackMessagePostApi = async (req, res) => {
  const { 
    arg,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'arg', arg),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await slackMessagePost(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  slackMessagePost,
  slackMessagePostApi,
};

// curl localhost:8000/slackMessagePost -H "Content-Type: application/json" -d '{ "arg": "1234" }'