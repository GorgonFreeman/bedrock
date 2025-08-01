const { respond, mandateParam, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyShippingGet = async (
  blueprintId,
  printProviderId,
  {
    credsPath,
  } = {},
) => {

  const response = await printifyClient.fetch({
    url: `/catalog/blueprints/${ blueprintId }/print_providers/${ printProviderId }/shipping.json`, 
    verbose: true,
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
};

const printifyShippingGetApi = async (req, res) => {
  const { 
    blueprintId,
    printProviderId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'blueprintId', blueprintId),
    mandateParam(res, 'printProviderId', printProviderId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyShippingGet(
    blueprintId,
    printProviderId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyShippingGet,
  printifyShippingGetApi,
};

// curl localhost:8000/printifyShippingGet -H "Content-Type: application/json" -d '{ "blueprintId": "421", "printProviderId": "23" }'