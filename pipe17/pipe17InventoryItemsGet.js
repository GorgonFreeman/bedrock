const { respond, mandateParam } = require('../utils');

const pipe17InventoryItemsGet = async (
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

const pipe17InventoryItemsGetApi = async (req, res) => {
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

  const result = await pipe17InventoryItemsGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17InventoryItemsGet,
  pipe17InventoryItemsGetApi,
};

// curl localhost:8000/pipe17InventoryItemsGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'