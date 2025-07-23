const { respond, mandateParam, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyBlueprintPrintProviderVariantsGet = async (
  blueprintId,
  printProviderId,
  {
    credsPath,
    showOutOfStock,
  } = {},
) => {

  const params = {
    ...showOutOfStock ? { 'show-out-of-stock': showOutOfStock } : {}, 
  };

  const response = await printifyClient.fetch({
    url: `/catalog/blueprints/${ blueprintId }/print_providers/${ printProviderId }/variants.json`, 
    params,
    verbose: true,
    factoryArgs: [credsPath],
  });

  logDeep(response);
  return response;
  
};

const printifyBlueprintPrintProviderVariantsGetApi = async (req, res) => {
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

  const result = await printifyBlueprintPrintProviderVariantsGet(
    blueprintId,
    printProviderId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyBlueprintPrintProviderVariantsGet,
  printifyBlueprintPrintProviderVariantsGetApi,
};

// curl localhost:8000/printifyBlueprintPrintProviderVariantsGet -H "Content-Type: application/json" -d '{ "blueprintId": 421, "printProviderId": 23 }'