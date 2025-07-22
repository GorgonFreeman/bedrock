const { respond, mandateParam, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyOrderCancel = async (
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

const printifyOrderCancelApi = async (req, res) => {
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

  const result = await printifyOrderCancel(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyOrderCancel,
  printifyOrderCancelApi,
};

// curl localhost:8000/printifyOrderCancel -H "Content-Type: application/json" -d '{ "arg": "1234" }'