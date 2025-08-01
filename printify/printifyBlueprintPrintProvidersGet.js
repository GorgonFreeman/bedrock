const { respond, mandateParam, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyBlueprintPrintProvidersGet = async (
  blueprintId,
  {
    credsPath,
  } = {},
) => {

  const response = await printifyClient.fetch({
    url: `/catalog/blueprints/${ blueprintId }/print_providers.json`, 
    verbose: true,
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
};

const printifyBlueprintPrintProvidersGetApi = async (req, res) => {
  const { 
    blueprintId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'blueprintId', blueprintId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyBlueprintPrintProvidersGet(
    blueprintId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyBlueprintPrintProvidersGet,
  printifyBlueprintPrintProvidersGetApi,
};

// curl localhost:8000/printifyBlueprintPrintProvidersGet -H "Content-Type: application/json" -d '{ "blueprintId": "421" }'