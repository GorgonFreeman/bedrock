const { respond, mandateParam, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyOrdersSubmit = async (
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

const printifyOrdersSubmitApi = async (req, res) => {
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

  const result = await printifyOrdersSubmit(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyOrdersSubmit,
  printifyOrdersSubmitApi,
};

// curl localhost:8000/printifyOrdersSubmit -H "Content-Type: application/json" -d '{ "arg": "1234" }'