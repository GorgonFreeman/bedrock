const { respond, mandateParam, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyBlueprintGet = async (
  blueprintId,
  {
    credsPath,
  } = {},
) => {

  const response = await printifyClient.fetch({
    url: `/catalog/blueprints/${ blueprintId }.json`,
    verbose: true,
    credsPath,
  });

  logDeep(response);
  return response;
  
};

const printifyBlueprintGetApi = async (req, res) => {
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

  const result = await printifyBlueprintGet(
    blueprintId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyBlueprintGet,
  printifyBlueprintGetApi,
};

// curl localhost:8000/printifyBlueprintGet -H "Content-Type: application/json" -d '{ "blueprintId": "421" }'