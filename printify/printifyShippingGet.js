const { respond, mandateParam, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyShippingGet = async (
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

const printifyShippingGetApi = async (req, res) => {
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

  const result = await printifyShippingGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyShippingGet,
  printifyShippingGetApi,
};

// curl localhost:8000/printifyShippingGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'