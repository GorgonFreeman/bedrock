const { respond, mandateParam, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyWebhookCreate = async (
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

const printifyWebhookCreateApi = async (req, res) => {
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

  const result = await printifyWebhookCreate(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyWebhookCreate,
  printifyWebhookCreateApi,
};

// curl localhost:8000/printifyWebhookCreate -H "Content-Type: application/json" -d '{ "arg": "1234" }'