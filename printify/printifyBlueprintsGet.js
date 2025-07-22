const { respond, mandateParam } = require('../utils');

const printifyBlueprintsGet = async (
  arg,
  {
    option,
  } = {},
) => {

  return { 
    arg, 
    option,
  };
  
};

const printifyBlueprintsGetApi = async (req, res) => {
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

  const result = await printifyBlueprintsGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyBlueprintsGet,
  printifyBlueprintsGetApi,
};

// curl localhost:8000/printifyBlueprintsGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'