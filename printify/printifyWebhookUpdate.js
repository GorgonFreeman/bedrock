const { respond, mandateParam, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyWebhookUpdate = async (
  arg,
  {
    credsPath,
    option,
  } = {},
) => {

  const response = await printifyClient.fetch({
    url: '/things.json', 
    verbose: true,
    credsPath,
  });

  logDeep(response);
  return response;
  
};

const printifyWebhookUpdateApi = async (req, res) => {
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

  const result = await printifyWebhookUpdate(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyWebhookUpdate,
  printifyWebhookUpdateApi,
};

// curl localhost:8000/printifyWebhookUpdate -H "Content-Type: application/json" -d '{ "arg": "1234" }'