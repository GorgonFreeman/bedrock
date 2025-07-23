const { respond, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyBlueprintsGet = async (
  {
    credsPath,
  } = {},
) => {

  const response = await printifyClient.fetch({
    url: '/catalog/blueprints.json', 
    verbose: true,
    factoryArgs: [credsPath],
  });

  logDeep(response);
  return response;
};

const printifyBlueprintsGetApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await printifyBlueprintsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyBlueprintsGet,
  printifyBlueprintsGetApi,
};

// curl localhost:8000/printifyBlueprintsGet
// curl localhost:8000/printifyBlueprintsGet -H "Content-Type: application/json" -d '{ "options": { "credsPath": "test" } }'