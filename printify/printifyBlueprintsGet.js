const { respond, credsByPath } = require('../utils');

const printifyBlueprintsGet = async (
  {
    credsPath,
  } = {},
) => {

  const creds = credsByPath([
    'printify', 
    ...credsPath?.split('.') ?? [],
  ]);
  console.log(creds);

  const { 
    API_KEY,
    BASE_URL,
  } = creds;

  const headers = {
    'Authorization': `Bearer ${ API_KEY }`,
  };

  return creds;
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