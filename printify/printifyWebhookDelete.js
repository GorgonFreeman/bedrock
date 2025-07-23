const { respond, mandateParam, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyWebhookDelete = async (
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

const printifyWebhookDeleteApi = async (req, res) => {
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

  const result = await printifyWebhookDelete(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyWebhookDelete,
  printifyWebhookDeleteApi,
};

// curl localhost:8000/printifyWebhookDelete -H "Content-Type: application/json" -d '{ "arg": "1234" }'