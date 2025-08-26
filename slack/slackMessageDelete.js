const { respond, mandateParam } = require('../utils');

const slackMessageDelete = async (
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

const slackMessageDeleteApi = async (req, res) => {
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

  const result = await slackMessageDelete(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  slackMessageDelete,
  slackMessageDeleteApi,
};

// curl localhost:8000/slackMessageDelete -H "Content-Type: application/json" -d '{ "arg": "1234" }'