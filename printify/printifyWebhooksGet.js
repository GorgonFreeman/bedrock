const { respond, mandateParam, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyWebhooksGet = async (
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

const printifyWebhooksGetApi = async (req, res) => {
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

  const result = await printifyWebhooksGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyWebhooksGet,
  printifyWebhooksGetApi,
};

// curl localhost:8000/printifyWebhooksGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'