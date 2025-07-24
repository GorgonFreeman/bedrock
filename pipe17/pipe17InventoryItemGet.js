const { respond, mandateParam } = require('../utils');

const pipe17InventoryItemGet = async (
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

const pipe17InventoryItemGetApi = async (req, res) => {
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

  const result = await pipe17InventoryItemGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17InventoryItemGet,
  pipe17InventoryItemGetApi,
};

// curl localhost:8000/pipe17InventoryItemGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'