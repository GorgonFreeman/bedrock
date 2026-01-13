// https://apidoc.pipe17.com/#/operations/fetchInventory

const { respond, mandateParam, logDeep } = require('../utils');
const { pipe17GetSingle } = require('../pipe17/pipe17GetSingle');

const pipe17InventoryItemGet = async (
  inventoryItemId,
  {
    credsPath,
  } = {},
) => {

  const response = await pipe17GetSingle(
    'inventory',
    inventoryItemId,
    {
      credsPath,
    },
  );  
  logDeep(response);
  return response;
};

const pipe17InventoryItemGetApi = async (req, res) => {
  const { 
    inventoryItemId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'inventoryItemId', inventoryItemId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await pipe17InventoryItemGet(
    inventoryItemId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  pipe17InventoryItemGet,
  pipe17InventoryItemGetApi,
};

// curl localhost:8000/pipe17InventoryItemGet -H "Content-Type: application/json" -d '{ "inventoryItemId": "904e7f5e7a03df4f" }'